import { useStore, UploadTask } from "@/store/useStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function uploadFilesInBackground(
  files: FileList | File[], 
  workspaceId: string, 
  folder: string = "General",
  onComplete?: () => void
) {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) return;

  const { addUploadTasks, updateUploadTask } = useStore.getState();

  const newTasks: UploadTask[] = fileArray.map((file) => ({
    id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    filename: file.name,
    fileSize: file.size,
    progress: 0,
    status: "uploading",
    folder: folder || "General"
  }));

  addUploadTasks(newTasks);

  fileArray.forEach((file, index) => {
    const task = newTasks[index];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspace_id", workspaceId || "ws-default");
    formData.append("folder", folder || "General");
    formData.append("tags", JSON.stringify(["uploaded", "b2"]));

    const xhr = new XMLHttpRequest();
    const endpoint = `${API_BASE_URL.replace(/\/$/, "")}/media/`;
    xhr.open("POST", endpoint);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        updateUploadTask(task.id, { progress: percent });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        updateUploadTask(task.id, { progress: 100, status: "completed" });
        if (onComplete) onComplete();
      } else {
        let errMessage = `HTTP ${xhr.status}`;
        try {
          const resJson = JSON.parse(xhr.responseText);
          errMessage = resJson.detail || resJson.message || errMessage;
        } catch (e) {
          errMessage = xhr.responseText || errMessage;
        }
        updateUploadTask(task.id, { 
          status: "error", 
          errorMessage: errMessage 
        });
      }
    };

    xhr.onerror = () => {
      updateUploadTask(task.id, { 
        status: "error", 
        errorMessage: "Network error. Make sure backend is running on http://localhost:8000" 
      });
    };

    xhr.send(formData);
  });
}
