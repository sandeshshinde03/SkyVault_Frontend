// frontend/src/pages/FileUpload.jsx
import React, { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "../utils/supabaseClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function FileUpload({ folderId = null, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const cancelRef = useRef(false); // used to simulate cancel

  const onDrop = async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      setUploading(true);
      setProgress(10);
      setCurrentFile(file.name);
      cancelRef.current = false;

      // Animate progress up to 90%
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 300);

      try {
        const filePath = `${folderId ?? "root"}/${file.name}`;
        const { error } = await supabase.storage
          .from("files")
          .upload(filePath, file, { upsert: true });

        if (cancelRef.current) {
          clearInterval(interval);
          setUploading(false);
          setProgress(0);
          setCurrentFile(null);
          toast.info(`${file.name} upload canceled`);
          return;
        }

        if (error) throw error;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!cancelRef.current) {
          const { error: dbError } = await supabase.from("files").insert([
            {
              path: filePath,
              name: file.name,
              folder_id: folderId,
              user_id: user.id,
            },
          ]);

          if (dbError) throw dbError;

          clearInterval(interval);
          setProgress(100);
          toast.success(`${file.name} uploaded successfully`);

          onUploadComplete && onUploadComplete();
        }
      } catch (err) {
        if (!cancelRef.current) {
          console.error("Upload error:", err.message);
          toast.error(`${file.name} failed to upload`);
        }
      } finally {
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
          setCurrentFile(null);
        }, 800);
      }
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setProgress(0);
    setUploading(false);
    setCurrentFile(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-400 p-4 rounded-lg text-center mb-4 cursor-pointer relative"
    >
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the files here ...</p> : <p>Upload File</p>}

      {uploading && (
        <div className="mt-2 w-full text-left">
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 relative">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              className="absolute right-0 -top-6 text-red-500 font-bold"
            >
              ✕
            </button>
          </div>
          {/* File name */}
          {currentFile && (
            <p className="text-sm text-gray-600 mt-1">{currentFile}</p>
          )}
        </div>
      )}
    </div>
  );
}
