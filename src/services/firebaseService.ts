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
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Poll, MissionActivity, VoteResult, User } from '../types';

// --- Polls ---

export const getPolls = async () => {
  const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
};

export const subscribeToPolls = (callback: (polls: Poll[]) => void) => {
  const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll)));
  });
};

export const getPoll = async (id: string) => {
  const docRef = doc(db, 'polls', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Poll;
  }
  return null;
};

export const subscribeToPoll = (id: string, callback: (poll: Poll | null) => void) => {
  return onSnapshot(doc(db, 'polls', id), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Poll);
    } else {
      callback(null);
    }
  });
};

export const createPoll = async (poll: Poll) => {
  await setDoc(doc(db, 'polls', poll.id), poll);
};

export const updatePoll = async (id: string, data: Partial<Poll>) => {
  await updateDoc(doc(db, 'polls', id), data);
};

export const deletePoll = async (id: string) => {
  await deleteDoc(doc(db, 'polls', id));
};

// --- Votes ---

export const castVote = async (pollId: string, userId: string, responses: any[]) => {
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
};

export const subscribeToVotes = (pollId: string, callback: (results: VoteResult[]) => void) => {
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
  });
};

// --- Missions ---

export const getMissions = async () => {
  const q = query(collection(db, 'missions'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissionActivity));
};

export const subscribeToMissions = (callback: (missions: MissionActivity[]) => void) => {
  const q = query(collection(db, 'missions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissionActivity)));
  });
};

export const getMission = async (id: string) => {
  const docRef = doc(db, 'missions', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as MissionActivity;
  }
  return null;
};

export const subscribeToMission = (id: string, callback: (mission: MissionActivity | null) => void) => {
  return onSnapshot(doc(db, 'missions', id), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as MissionActivity);
    } else {
      callback(null);
    }
  });
};

export const createMission = async (mission: MissionActivity) => {
  await setDoc(doc(db, 'missions', mission.id), mission);
};

export const updateMission = async (id: string, data: Partial<MissionActivity>) => {
  await updateDoc(doc(db, 'missions', id), data);
};

export const deleteMission = async (id: string) => {
  await deleteDoc(doc(db, 'missions', id));
};

// --- Users ---

export const getUserProfile = async (id: string) => {
  const docSnap = await getDoc(doc(db, 'users', id));
  if (docSnap.exists()) {
    return docSnap.data() as User;
  }
  return null;
};

export const createUserProfile = async (user: User) => {
  await setDoc(doc(db, 'users', user.id), {
    ...user,
    createdAt: Date.now()
  });
};
