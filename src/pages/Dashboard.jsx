import { useEffect, useState, useMemo } from "react"; 
import { supabase } from "../utils/supabaseClient";
import {
  Folder,
  FileText,
  File,
  MoreVertical,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import FileUpload from "./FileUpload";
import FileViewer from "./FileViewer";
import ShareModal from "./ShareModal"; // ✅ Import
import { useNavigate } from "react-router-dom";
import {
  renameApi,
  softDeleteApi,
  restoreApi,
  permanentDeleteApi,
  moveApi,
  createFolderApi,
} from "../components/fileService";

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: "My Drive" }]);
  const [activeTab, setActiveTab] = useState("drive");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [userEmail, setUserEmail] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [draggingItem, setDraggingItem] = useState(null);
  const [shareModalItem, setShareModalItem] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const navigate = useNavigate();

  // --- Fetch files & folders ---
  const fetchFiles = async (folderId = currentFolder, tab = activeTab) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let url = `${import.meta.env.VITE_BACKEND_URL}/api/files?tab=${tab}`;
    if (folderId) url += `&folderId=${folderId}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = await res.json();
    const folderItems = result.folders || [];
    const fileItems = result.files || [];

    const filesWithUrls = fileItems.map((f) => ({
      ...f,
      publicUrl: f.publicUrl || supabase.storage.from("files").getPublicUrl(f.path).data.publicUrl,
    }));

    setFolders(folderItems);
    setFiles(filesWithUrls);
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, [activeTab, currentFolder]);

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);
      if (error) console.error("Error fetching user:", error.message);
    };
    getUserEmail();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // --- File/Folder actions ---
  const renameItem = async (item, type, newName) => {
    if (!newName.trim() || newName === item.name) {
      setEditingId(null);
      setEditingName("");
      return;
    }
    try {
      await renameApi(item.id, newName, type);
      setEditingId(null);
      setEditingName("");
      fetchFiles();
    } catch (err) {
      console.error("Rename failed:", err);
      setEditingId(null);
      setEditingName("");
    }
  };

  const softDeleteItem = async (item, type) => { await softDeleteApi(item.id, type); fetchFiles(); };
  const restoreItem = async (item, type) => { await restoreApi(item.id, type); fetchFiles(); };
  const permanentDeleteItem = async (item, type) => { await permanentDeleteApi(item.id, type); fetchFiles(); };
  const moveItem = async (item, folderId) => { await moveApi(item.id, folderId || null, item.type); fetchFiles(); };

  // ✅ Inline folder creation
  const createNewFolder = async () => { setCreatingFolder(true); };

  const openFolder = (folder) => {
    setCurrentFolder(folder.id);
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
  };
  const openFile = (file) => setPreviewFile(file);

  // --- Share a file/folder ---
  const handleShare = async (item, email, role = "viewer") => {
    if (!email) return Promise.reject(new Error("Please enter a valid email."));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return Promise.reject(new Error("You must be logged in to share files."));

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/shares`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ file_id: item.id, shared_with_email: email, role }),
      });

      const data = await res.json();
      if (!res.ok) return Promise.reject(new Error(data.error || "Failed to share item"));

      return data;
    } catch (err) {
      console.error("Sharing failed:", err);
      return Promise.reject(err);
    }
  };

  const handleBreadcrumbClick = (folderId, index) => {
    setCurrentFolder(folderId);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  // --- Filtered & Sorted Lists ---
  const filteredFolders = useMemo(() => {
    return folders
      .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "size") return (a.size || 0) - (b.size || 0);
        if (sortBy === "created_at") return new Date(a.created_at) - new Date(b.created_at);
        return 0;
      });
  }, [folders, searchQuery, sortBy]);

  const filteredFiles = useMemo(() => {
    return files
      .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "size") return (a.size || 0) - (b.size || 0);
        if (sortBy === "created_at") return new Date(a.created_at) - new Date(b.created_at);
        return 0;
      });
  }, [files, searchQuery, sortBy]);

  const getFileIcon = (file) => {
    if (!file.type) return <File className="w-12 h-12 text-gray-500" />;
    if (file.type.includes("pdf")) return <FileText className="w-12 h-12 text-red-500" />;
    if (file.type.includes("image")) return <File className="w-12 h-12 text-green-500" />;
    return <FileText className="w-12 h-12 text-blue-500" />;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-lg font-semibold mb-2">SkyVault</h1>
          {userEmail && <p className="text-sm text-gray-500 mb-6 truncate">{userEmail}</p>}
          <div className="mt-4">
            <FileUpload folderId={currentFolder} onUploadComplete={fetchFiles} />
          </div>
          <button
            onClick={() => { setActiveTab("drive"); setCurrentFolder(null); setBreadcrumbs([{ id: null, name: "My Drive" }]); }}
            className={`flex items-center space-x-2 p-2 rounded-md mb-2 ${activeTab === "drive" ? "bg-gray-200" : "hover:bg-gray-100"}`}
          >
            <Folder className="w-5 h-5" /> <span>My Drive</span>
          </button>
          <button
            onClick={() => { setActiveTab("shared"); setCurrentFolder(null); setBreadcrumbs([{ id: null, name: "Shared with me" }]); }}
            className={`flex items-center space-x-2 p-2 rounded-md mb-2 ${activeTab === "shared" ? "bg-gray-200" : "hover:bg-gray-100"}`}
          >
            <Users className="w-5 h-5" /> <span>Shared with me</span>
          </button>
          <button
            onClick={() => { setActiveTab("trash"); setCurrentFolder(null); setBreadcrumbs([{ id: null, name: "Trash" }]); }}
            className={`flex items-center space-x-2 p-2 rounded-md mb-2 ${activeTab === "trash" ? "bg-gray-200" : "hover:bg-gray-100"}`}
          >
            <Trash2 className="w-5 h-5" /> <span>Trash</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1 mr-4 flex items-center">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search in Drive..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ml-2 border p-1 rounded-lg"
            >
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
              <option value="created_at">Sort by Date</option>
            </select>
          </div>
          {activeTab === "drive" && !creatingFolder && (
            <button
              onClick={createNewFolder}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow mr-2"
            >
              + New Folder
            </button>
          )}
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/login", { replace: true }); }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow"
          >
            Logout
          </button>
        </div>

        {/* Breadcrumbs */}
        <div
          className="flex items-center space-x-2 text-sm text-gray-600 mb-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (draggingItem) { moveItem(draggingItem, null); setDraggingItem(null); } }}
        >
          {breadcrumbs.map((bc, i) => (
            <span key={bc.id || "root"} className="flex items-center space-x-1">
              {i > 0 && <span>/</span>}
              <span
                onClick={() => handleBreadcrumbClick(bc.id, i)}
                className="cursor-pointer hover:underline"
              >
                {bc.name}
              </span>
            </span>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {/* Inline folder creation */}
            {creatingFolder && (
              <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
                <Folder className="w-12 h-12 text-yellow-500" />
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={async () => {
                    if (newFolderName.trim() !== "") {
                      await createFolderApi(newFolderName, currentFolder);
                      fetchFiles();
                    }
                    setNewFolderName("");
                    setCreatingFolder(false);
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && newFolderName.trim() !== "") {
                      await createFolderApi(newFolderName, currentFolder);
                      fetchFiles();
                      setNewFolderName("");
                      setCreatingFolder(false);
                    }
                    if (e.key === "Escape") {
                      setNewFolderName("");
                      setCreatingFolder(false);
                    }
                  }}
                  autoFocus
                  className="mt-2 border px-2 py-1 rounded text-sm w-full text-center"
                  placeholder="Folder name"
                />
              </div>
            )}

            {/* Folders */}
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                className="group relative bg-white rounded-xl shadow hover:shadow-lg p-4 cursor-pointer flex flex-col items-center transition"
                onClick={() => openFolder(folder)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.stopPropagation(); if (draggingItem) { moveItem(draggingItem, folder.id); setDraggingItem(null); } }}
              >
                <Folder className="w-12 h-12 text-yellow-500" />
                {editingId === folder.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => renameItem(folder, "folder", editingName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameItem(folder, "folder", editingName);
                      if (e.key === "Escape") { setEditingId(null); setEditingName(""); }
                    }}
                    autoFocus
                    className="border rounded px-2 py-1 text-sm w-full"
                  />
                ) : (
                  <p
                    onDoubleClick={() => { setEditingId(folder.id); setEditingName(folder.name); }}
                    className="mt-2 text-sm text-gray-700 w-full text-center truncate max-w-[100px] break-all cursor-text"
                  >
                    {folder.name}
                  </p>
                )}
                <div className="absolute right-2 top-2">
                  <MoreVertical
                    className="w-5 h-5 text-gray-500 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === folder.id ? null : folder.id); }}
                  />
                  {menuOpenId === folder.id && (
                    <div className="absolute right-0 top-8 bg-white border rounded shadow-lg z-50" onClick={(e) => e.stopPropagation()}>
                      {activeTab === "drive" && (
                        <>
                          <button
                            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                            onClick={() => { setEditingId(folder.id); setEditingName(folder.name); setMenuOpenId(null); }}
                          >
                            Rename
                          </button>
                          <button
                            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                            onClick={() => setShareModalItem(folder)}
                          >
                            Share
                          </button>
                          <button
                            className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                            onClick={() => softDeleteItem(folder, "folder")}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {activeTab === "trash" && (
                        <>
                          <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left" onClick={() => restoreItem(folder, "folder")}>Restore</button>
                          <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600" onClick={() => permanentDeleteItem(folder, "folder")}>Delete Forever</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Files */}
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group relative bg-white rounded-xl shadow hover:shadow-lg p-4 flex flex-col items-center transition cursor-pointer"
                draggable
                onDragStart={() => setDraggingItem({ ...file, type: "file" })}
                onClick={() => openFile(file)}
              >
                {getFileIcon(file)}
                {editingId === file.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => renameItem(file, "file", editingName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameItem(file, "file", editingName);
                      if (e.key === "Escape") { setEditingId(null); setEditingName(""); }
                    }}
                    autoFocus
                    className="border rounded px-2 py-1 text-sm w-full"
                  />
                ) : (
                  <p
                    onDoubleClick={() => { setEditingId(file.id); setEditingName(file.name); }}
                    className="mt-2 text-sm text-gray-700 w-full text-center truncate max-w-[100px] break-all cursor-text"
                  >
                    {file.name}
                  </p>
                )}
                <div className="absolute right-2 top-2">
                  <MoreVertical
                    className="w-5 h-5 text-gray-500 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === file.id ? null : file.id); }}
                  />
                  {menuOpenId === file.id && (
                    <div className="absolute right-0 top-8 bg-white border rounded shadow-lg z-50" onClick={(e) => e.stopPropagation()}>
                      {activeTab === "drive" && (
                        <>
                          <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left" onClick={() => { setEditingId(file.id); setEditingName(file.name); setMenuOpenId(null); }}>Rename</button>
                          <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left" onClick={() => setShareModalItem(file)}>Share</button>
                          <select className="block w-full px-4 py-2 hover:bg-gray-100" onChange={(e) => { if (e.target.value) { moveItem(file, e.target.value === "“" ? null : e.target.value); setMenuOpenId(null); } }}>
                            <option value="">Move to Root</option>
                            {folders.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                          </select>
                          <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600" onClick={() => softDeleteItem(file, "file")}>Delete</button>
                        </>
                      )}
                      {activeTab === "trash" && (
                        <>
                          <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left" onClick={() => restoreItem(file, "file")}>Restore</button>
                          <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600" onClick={() => permanentDeleteItem(file, "file")}>Delete Forever</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File Viewer */}
        {previewFile && <FileViewer fileUrl={previewFile.publicUrl} onClose={() => setPreviewFile(null)} />}

        {/* Share Modal */}
        {shareModalItem && <ShareModal item={shareModalItem} onClose={() => setShareModalItem(null)} onShare={handleShare} />}
      </main>
    </div>
  );
};

export default Dashboard;
