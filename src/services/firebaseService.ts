import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  increment,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
export { arrayUnion, arrayRemove };
import { db, auth } from '../firebase';
import { Poll, MissionActivity, VoteResult, User } from '../types';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Polls ---

export const getPolls = async () => {
  const path = 'polls';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const subscribeToPolls = (callback: (polls: Poll[]) => void) => {
  const path = 'polls';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll)));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const getPoll = async (id: string) => {
  const path = `polls/${id}`;
  try {
    const docRef = doc(db, 'polls', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Poll;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const subscribeToPoll = (id: string, callback: (poll: Poll | null) => void) => {
  const path = `polls/${id}`;
  return onSnapshot(doc(db, 'polls', id), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Poll);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const createPoll = async (poll: Poll) => {
  const path = `polls/${poll.id}`;
  try {
    await setDoc(doc(db, 'polls', poll.id), poll);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updatePoll = async (id: string, data: Partial<Poll>) => {
  const path = `polls/${id}`;
  try {
    await updateDoc(doc(db, 'polls', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deletePoll = async (id: string) => {
  const path = `polls/${id}`;
  try {
    await deleteDoc(doc(db, 'polls', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// --- Votes ---

export const castVote = async (pollId: string, userId: string, responses: any[]) => {
  const path = `polls/${pollId}/votes`;
  try {
    const batch = writeBatch(db);
    for (const resp of responses) {
      const voteId = `${userId}_${resp.questionId}_${resp.teamId || 'no-team'}`;
      const voteRef = doc(db, 'polls', pollId, 'votes', voteId);
      batch.set(voteRef, {
        pollId,
        userId,
        ...resp,
        createdAt: Date.now()
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeToVotes = (pollId: string, callback: (results: VoteResult[]) => void) => {
  const path = `polls/${pollId}/votes`;
  const q = collection(db, 'polls', pollId, 'votes');
  return onSnapshot(q, (snapshot) => {
    const votes = snapshot.docs.map(doc => doc.data());
    const resultsMap: Record<string, number> = {};
    
    votes.forEach((v: any) => {
      const key = `${v.questionId}_${v.teamId || ''}_${v.optionIndex}`;
      resultsMap[key] = (resultsMap[key] || 0) + 1;
    });
    
    const results: VoteResult[] = Object.entries(resultsMap).map(([key, count]) => {
      const [questionId, teamId, optionIndex] = key.split('_');
      return {
        questionId,
        teamId: teamId || undefined,
        optionIndex: parseInt(optionIndex),
        count
      };
    });
    
    callback(results);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

// --- Missions ---

export const getMissions = async () => {
  const path = 'missions';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissionActivity));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const subscribeToMissions = (callback: (missions: MissionActivity[]) => void) => {
  const path = 'missions';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissionActivity)));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const getMission = async (id: string) => {
  const path = `missions/${id}`;
  try {
    const docRef = doc(db, 'missions', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MissionActivity;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const subscribeToMission = (id: string, callback: (mission: MissionActivity | null) => void) => {
  const path = `missions/${id}`;
  return onSnapshot(doc(db, 'missions', id), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as MissionActivity);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const createMission = async (mission: MissionActivity) => {
  const path = `missions/${mission.id}`;
  try {
    await setDoc(doc(db, 'missions', mission.id), mission);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateMission = async (id: string, data: Partial<MissionActivity>) => {
  const path = `missions/${id}`;
  try {
    await updateDoc(doc(db, 'missions', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteMission = async (id: string) => {
  const path = `missions/${id}`;
  try {
    await deleteDoc(doc(db, 'missions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// --- Users ---

export const getUserProfile = async (id: string) => {
  const path = `users/${id}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', id));
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const createUserProfile = async (user: User) => {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), {
      ...user,
      createdAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};
