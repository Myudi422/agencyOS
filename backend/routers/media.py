from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import List, Optional
import json
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

@router.get("/")
def get_media_items(
    workspace_id: str = Query(..., description="Workspace ID"),
    folder: Optional[str] = Query(None, description="Folder filter"),
    tag: Optional[str] = Query(None, description="Tag filter"),
    search: Optional[str] = Query(None, description="Filename search"),
    favorites_only: Optional[bool] = Query(False, description="Favorites only"),
    db: Session = Depends(get_db)
):
    """Lists reusable media assets from Backblaze B2 S3 with tag & folder filters."""
    query = db.query(Media).filter(Media.workspace_id == workspace_id)

    if folder and folder != "All":
        query = query.filter(Media.folder == folder)
    if favorites_only:
        query = query.filter(Media.is_favorite == True)
    if search:
        query = query.filter(Media.filename.ilike(f"%{search}%"))

    items = query.order_by(Media.created_at.desc()).all()

    # Filter tags in python if specified
    if tag:
        items = [i for i in items if tag in (i.tags or [])]

    # Collect folders and tags summary
    all_media = db.query(Media).filter(Media.workspace_id == workspace_id).all()
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
    tags: str = Form("[]"), # JSON array string
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
        parsed_tags = json.loads(tags)
    except:
        parsed_tags = []

    media_obj = Media(
        workspace_id=workspace_id,
        filename=upload_res["filename"],
        file_type=upload_res["file_type"],
        file_size=upload_res["file_size"],
        url=upload_res["url"],
        thumbnail_url=upload_res["thumbnail_url"],
        b2_key=upload_res["b2_key"],
        folder=folder,
        tags=parsed_tags,
        width=upload_res["width"],
        height=upload_res["height"],
        duration=upload_res["duration"]
    )

    db.add(media_obj)
    db.add(ActivityLog(
        workspace_id=workspace_id,
        action="UPLOAD_MEDIA",
        details=f"Uploaded asset '{media_obj.filename}' to Backblaze B2 ({folder})",
        entity_type="Media"
    ))
    db.commit()
    db.refresh(media_obj)
    return media_obj

@router.put("/{media_id}")
def update_media(media_id: str, data: MediaUpdate, db: Session = Depends(get_db)):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    if data.folder is not None:
        media.folder = data.folder
    if data.tags is not None:
        media.tags = data.tags
    if data.is_favorite is not None:
        media.is_favorite = data.is_favorite

    db.commit()
    return media

@router.delete("/{media_id}")
def delete_media(media_id: str, db: Session = Depends(get_db)):
    """Deletes single media record from database and removes object from Backblaze B2 bucket."""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Delete from Backblaze B2 S3 storage
    if media.b2_key:
        storage_service.delete_file(media.b2_key)

    workspace_id = media.workspace_id
    filename = media.filename
    db.delete(media)

    db.add(ActivityLog(
        workspace_id=workspace_id,
        action="DELETE_MEDIA",
        details=f"Deleted asset '{filename}' from Backblaze B2 & database",
        entity_type="Media"
    ))
    db.commit()
    return {"status": "success", "message": f"Media '{filename}' deleted successfully"}

@router.post("/bulk-delete")
def bulk_delete_media(data: BulkDeleteRequest, db: Session = Depends(get_db)):
    """Deletes multiple media records from database and Backblaze B2 storage in batch."""
    items = db.query(Media).filter(Media.id.in_(data.media_ids)).all()
    if not items:
        raise HTTPException(status_code=404, detail="No matching media items found")

    count = len(items)
    b2_keys = [m.b2_key for m in items if m.b2_key]
    workspace_id = items[0].workspace_id if items else "ws-default"

    # Delete objects batch from Backblaze B2
    storage_service.delete_bulk_files(b2_keys)

    for m in items:
        db.delete(m)

    db.add(ActivityLog(
        workspace_id=workspace_id,
        action="BULK_DELETE_MEDIA",
        details=f"Bulk deleted {count} media assets from Backblaze B2 & database",
        entity_type="Media"
    ))
    db.commit()
    return {"status": "success", "message": f"Successfully deleted {count} media assets."}
