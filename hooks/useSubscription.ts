'use client';

import { db } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import { collection, doc } from "firebase/firestore";
import { use, useEffect, useState } from "react";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";

const PRO_LIMIT = 20;
const FREE_LIMIT = 5;

function useSubscription() {
    const [hasActiveSubscription, setHasActiveSubscription] = useState(null)
    const [isOverFileLimit, setIsOverFileLimit] = useState(false)
    const { user } = useUser();

    const [snapshot, loading, error] = useDocument(
        user && doc(db, 'users', user.id),
        {
            snapshotListenOptions : {includeMetadataChanges: true}
        }
    )

    const [filesSnapshot, filesLoading] = useCollection(
        user && collection(db, "users", user?.id, "files")
    )

    useEffect(() => {
        if (!snapshot) return;

        const data = snapshot.data();
        if (!data) return;

        setHasActiveSubscription(data.activeSubscription)

    }, [snapshot])
}
export default useSubscription