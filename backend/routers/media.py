from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime
from backend.database import get_db
from backend.models.models import Media, ActivityLog
from backend.services.storage_service import storage_service

router = APIRouter(prefix="/media", tags=["Media Library"])

class MediaUpdate(BaseModel):
    folder: Optional[str] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None

class BulkDeleteRequest(BaseModel):
    media_ids: List[str]

class BulkMoveRequest(BaseModel):
    media_ids: List[str]
    target_folder: str

@router.post("/sync-b2")
def sync_b2_bucket(
    workspace_id: str = Query(..., description="Workspace ID to sync into"),
    db: Session = Depends(get_db)
):
    """
    Scans Backblaze B2 bucket (ccgnimex) under 'AgencyOS/' prefix directly and synchronizes files into database.
    """
    b2_objects = storage_service.list_b2_objects(limit=100)
    synced_count = 0

    for obj in b2_objects:
        existing = db.query(Media).filter(
            Media.workspace_id == workspace_id,
            Media.b2_key == obj["b2_key"]
        ).first()

        if not existing:
            media = Media(
                workspace_id=workspace_id,
                filename=obj["filename"],
                file_type=obj["file_type"],
                file_size=obj["file_size"],
                url=obj["url"],
                thumbnail_url=obj["url"],
                b2_key=obj["b2_key"],
                folder=obj["folder"],
                tags=["backblaze_b2", "synced"]
            )
            db.add(media)
            synced_count += 1

    if synced_count > 0:
        db.commit()

    return {"status": "success", "synced_count": synced_count, "total_b2_objects": len(b2_objects)}

@router.delete("/folder")
def delete_folder(
    folder: str = Query(..., description="Folder name to delete"),
    workspace_id: str = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db)
):
    """Deletes a folder and all media items inside it from Backblaze B2 storage and database."""
    clean_folder = folder.strip().capitalize()
    
    # 1. Fetch DB items
    db_items = db.query(Media).filter(
        Media.workspace_id == workspace_id,
        Media.folder == clean_folder,
        Media.b2_key.ilike("AgencyOS/%")
    ).all()
    db_b2_keys = [i.b2_key for i in db_items if i.b2_key]

    # 2. Scan B2 directly for any files under AgencyOS/{clean_folder}/
    b2_keys_to_delete = set(db_b2_keys)
    try:
        b2_objects = storage_service.list_b2_objects(limit=500)
        prefix = f"AgencyOS/{clean_folder}/"
        for obj in b2_objects:
            if obj["b2_key"].startswith(prefix):
                b2_keys_to_delete.add(obj["b2_key"])
    except Exception as e:
        print("B2 folder scan error during delete:", e)

    # 3. Purge from Backblaze B2 S3 storage
    if b2_keys_to_delete:
        storage_service.delete_bulk_files(list(b2_keys_to_delete))
        
    # 4. Purge from database
    for item in db_items:
        db.delete(item)

    log = ActivityLog(
        workspace_id=workspace_id,
        user_name="System",
        action="DELETE_FOLDER",
        details=f"Deleted folder '{clean_folder}' ({len(b2_keys_to_delete)} files purged from Backblaze B2 & database)",
        entity_type="MediaFolder"
    )
    db.add(log)

    db.commit()
    return {
        "status": "success", 
        "deleted_db_count": len(db_items), 
        "deleted_b2_count": len(b2_keys_to_delete), 
        "folder": clean_folder
    }

@router.post("/reset")
def reset_media_vault(
    workspace_id: str = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db)
):
    """Resets all media assets for the workspace from Backblaze B2 'AgencyOS/' and database."""
    items = db.query(Media).filter(
        Media.workspace_id == workspace_id,
        Media.b2_key.ilike("AgencyOS/%")
    ).all()
    
    b2_keys = [i.b2_key for i in items if i.b2_key]
    if b2_keys:
        storage_service.delete_bulk_files(b2_keys)
        
    for item in items:
        db.delete(item)

    log = ActivityLog(
        workspace_id=workspace_id,
        user_name="System",
        action="RESET_MEDIA_VAULT",
        details=f"Reset media vault: cleared {len(items)} assets from Backblaze B2 & database",
        entity_type="MediaVault"
    )
    db.add(log)

    db.commit()
    return {"status": "success", "deleted_count": len(items)}

@router.get("/")
def get_media_items(
    workspace_id: str = Query(..., description="Workspace ID"),
    folder: Optional[str] = Query(None, description="Folder filter"),
    tag: Optional[str] = Query(None, description="Tag filter"),
    search: Optional[str] = Query(None, description="Filename search"),
    favorites_only: Optional[bool] = Query(False, description="Favorites only"),
    db: Session = Depends(get_db)
):
    """Lists reusable media assets from Backblaze B2 S3 strictly under AgencyOS/ prefix."""
    query = db.query(Media).filter(
        Media.workspace_id == workspace_id,
        Media.b2_key.ilike("AgencyOS/%")
    )

    total_count = query.count()
    if total_count == 0:
        try:
            sync_b2_bucket(workspace_id=workspace_id, db=db)
            query = db.query(Media).filter(
                Media.workspace_id == workspace_id,
                Media.b2_key.ilike("AgencyOS/%")
            )
        except Exception as e:
            print("Auto B2 Sync warning:", e)

    if folder and folder != "All":
        query = query.filter(Media.folder == folder)
    if favorites_only:
        query = query.filter(Media.is_favorite == True)
    if search:
        query = query.filter(Media.filename.ilike(f"%{search}%"))

    items = query.order_by(Media.created_at.desc()).all()

    if tag:
        items = [i for i in items if tag in (i.tags or [])]

    all_media = db.query(Media).filter(
        Media.workspace_id == workspace_id,
        Media.b2_key.ilike("AgencyOS/%")
    ).all()
    folders = list(set([m.folder for m in all_media if m.folder]))
    all_tags = set()
    for m in all_media:
        for t in (m.tags or []):
            all_tags.add(t)

    return {
        "items": [
            {
                "id": m.id,
                "workspace_id": m.workspace_id,
                "filename": m.filename,
                "file_type": m.file_type,
                "file_size": m.file_size,
                "url": m.url,
                "thumbnail_url": m.thumbnail_url,
                "b2_key": m.b2_key,
                "folder": m.folder,
                "tags": m.tags or [],
                "is_favorite": m.is_favorite,
                "width": m.width,
                "height": m.height,
                "duration": m.duration,
                "created_at": m.created_at
            } for m in items
        ],
        "folders": sorted(folders),
        "tags": sorted(list(all_tags))
    }

@router.post("/")
async def upload_media(
    workspace_id: str = Form(...),
    folder: str = Form("General"),
    tags: str = Form("[]"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Uploads new media file to Backblaze B2 storage and saves metadata."""
    content = await file.read()
    
    upload_res = storage_service.upload_file(
        file_content=content,
        filename=file.filename or "upload.png",
        content_type=file.content_type or "image/png",
        folder=folder
    )

    try:
        tag_list = json.loads(tags)
    except:
        tag_list = ["uploaded"]

    media = Media(
        workspace_id=workspace_id,
        filename=upload_res["filename"],
        file_type=upload_res["file_type"],
        file_size=upload_res["file_size"],
        url=upload_res["url"],
        thumbnail_url=upload_res["thumbnail_url"],
        b2_key=upload_res["b2_key"],
        folder=folder,
        tags=tag_list,
        width=upload_res.get("width"),
        height=upload_res.get("height"),
        duration=upload_res.get("duration")
    )
    db.add(media)

    log = ActivityLog(
        workspace_id=workspace_id,
        user_name="System",
        action="UPLOAD_MEDIA",
        details=f"Uploaded '{file.filename}' to Backblaze B2 key '{upload_res['b2_key']}'",
        entity_type="Media",
        entity_id=media.id
    )
    db.add(log)

    db.commit()
    db.refresh(media)

    return media

@router.post("/bulk-move")
def bulk_move_media(req: BulkMoveRequest, db: Session = Depends(get_db)):
    """Moves multiple media items to a target folder in database."""
    clean_folder = req.target_folder.strip().capitalize()
    items = db.query(Media).filter(Media.id.in_(req.media_ids)).all()
    
    for item in items:
        item.folder = clean_folder

    db.commit()
    return {"status": "success", "moved_count": len(items), "target_folder": clean_folder}

@router.delete("/bulk-delete")
def bulk_delete_media(req: BulkDeleteRequest, db: Session = Depends(get_db)):
    """Deletes multiple media assets from Backblaze B2 and database."""
    items = db.query(Media).filter(Media.id.in_(req.media_ids)).all()
    b2_keys = [i.b2_key for i in items if i.b2_key]
    
    if b2_keys:
        storage_service.delete_bulk_files(b2_keys)

    for item in items:
        db.delete(item)

    db.commit()
    return {"status": "success", "deleted_count": len(items)}

@router.delete("/{media_id}")
def delete_media(media_id: str, db: Session = Depends(get_db)):
    """Deletes a single media file from Backblaze B2 storage and DB."""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media item not found")

    if media.b2_key:
        storage_service.delete_file(media.b2_key)

    db.delete(media)
    db.commit()
    return {"status": "success", "message": "Media asset deleted"}
