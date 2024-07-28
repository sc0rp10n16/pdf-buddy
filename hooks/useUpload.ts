"use client"

import { generateEmbeddings } from "@/actions/generateEmbeddings";
import { db, storage } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useState } from "react"
import { v4 as uuidv4 } from 'uuid';


export enum StatusText {
    UPLOADING = "Uploading file...",
    UPLOADED = "File uploaded successfully",
    SAVING = "Saving file to database...",
    GENERATING = "Generating AI embeddings, This will take only few seconds...",
}
export type Status = StatusText[keyof StatusText];

function useUpload() {
    const [progress, setProgress] = useState<number | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
    const [status, setSatus] = useState<Status | null>(null);
    const { user } = useUser();
    const router = useRouter();

    const handleUpload = async (file: File) => {
        if (!file || !user) return;

        // TODO: Free/pro limitations

        const fileIdToUploadTo = uuidv4();

        const storageRef = ref(storage, `users/${user.id}/files/${fileIdToUploadTo}`);

        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on("state_changed", (snapshot) => {
            const percent = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            )
            setSatus(StatusText.UPLOADING);
            setProgress(percent)
        },
            (error) => {
                console.error("Error uploading the file", error)
            },
            async () => {
                setSatus(StatusText.UPLOADED);

                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
                setSatus(StatusText.SAVING)
                await setDoc(doc(db, "users", user.id, 'files', fileIdToUploadTo), {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    downloadUrl: downloadUrl,
                    ref: uploadTask.snapshot.ref.fullPath,
                    createdAt: new Date()
                })

                setSatus(StatusText.GENERATING);
                
                await generateEmbeddings(fileIdToUploadTo)

                setFileId(fileIdToUploadTo)

            }
        );
    };
    return {progress, status, fileId, handleUpload}
}
export default useUpload