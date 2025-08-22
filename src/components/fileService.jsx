// src/components/fileService.jsx
import { supabase } from "../utils/supabaseClient";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

// === Fetch Files ===
export const fetchFilesApi = async (folderId, tab) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No auth session");

  let url = `${API_URL}/api/files?tab=${tab}`;
  if (folderId) url += `&folderId=${folderId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error("Error fetching files");
  return res.json();
};

// === Rename (file/folder) ===
export const renameApi = async (id, newName, type) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No auth session");

  const res = await fetch(`${API_URL}/api/files/rename`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ id, newName, type }),
  });
  if (!res.ok) throw new Error("Rename failed");
  return res.json();
};

// === File Delete / Restore ===
export const softDeleteApi = async (id, type = "file") => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No auth session");

  let endpoint;
  if (type === "file") endpoint = `${API_URL}/api/files/trash/${id}`;
  else if (type === "folder") endpoint = `${API_URL}/api/folders/${id}`;

  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
};

export const restoreApi = async (id) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No auth session");

  const res = await fetch(`${API_URL}/api/files/restore/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error("Restore failed");
  return res.json();
};

export const permanentDeleteApi = async (id) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No auth session");

  const res = await fetch(`${API_URL}/api/files/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error("Permanent delete failed");
  return res.json();
};

// === Move File ===
export const moveApi = async (id, folderId) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No auth session");

  const normalized = folderId === "root" || !folderId ? null : folderId;

  const res = await fetch(`${API_URL}/api/files/move`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ id, folder_id: normalized }),
  });
  if (!res.ok) throw new Error("Move failed");
  return res.json();
};

// === Folder CRUD ===
export const createFolderApi = async (name, parentId = null) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No auth session");

  const res = await fetch(`${API_URL}/api/files/folder`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ name, parent_id: parentId }),
  });
  if (!res.ok) throw new Error("Create folder failed");
  return res.json();
};

export const deleteFolderApi = async (id) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No auth session");

  const res = await fetch(`${API_URL}/api/folders/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error("Delete folder failed");
  return res.json();
};

// === Share APIs ===
export const shareItemApi = async (fileId, email, role = "viewer") => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No auth session");

  const res = await axios.post(
    `${API_URL}/shares`,
    { file_id: fileId, shared_with_email: email, role },
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );
  return res.data;
};

export const fetchShares = async (fileId) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No auth session");

  const res = await axios.get(`${API_URL}/shares/${fileId}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  return res.data || [];
};
