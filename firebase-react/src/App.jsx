// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import React, { useState, createContext, useContext, useEffect } from 'react';
import './App.css';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9Xx-3CnN0wPt7iQlPiIzrzGSs2gns298",

  authDomain: "tailwind-intro-morphos.firebaseapp.com",

  projectId: "tailwind-intro-morphos",

  storageBucket: "tailwind-intro-morphos.appspot.com",

  messagingSenderId: "385008546138",

  appId: "1:385008546138:web:15757934b077d103364363",

  measurementId: "G-NPSK0BVKGW"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  const logOut = () => {
    return signOut(auth);
  }

  const value = {
    user,
    signIn,
    logOut
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

function LandingPage() {
  const { user, signIn, logOut } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  useEffect(() => {
    if (user) {
      const q = query(collection(db, `users/${user.uid}/todos`));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const todosArray = [];
        querySnapshot.forEach((doc) => {
          todosArray.push({ ...doc.data(), id: doc.id });
        });
        setTodos(todosArray);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const addTodo = async (e) => {
    e.preventDefault();
    if (newTodo.trim() === '') return;
    try {
      await addDoc(collection(db, `users/${user.uid}/todos`), {
        text: newTodo,
        completed: false
      });
      setNewTodo('');
    } catch (error) {
      console.error("Error adding todo: ", error);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      await updateDoc(doc(db, `users/${user.uid}/todos`, id), {
        completed: !completed
      });
    } catch (error) {
      console.error("Error updating todo: ", error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await deleteDoc(doc(db, `users/${user.uid}/todos`, id));
    } catch (error) {
      console.error("Error deleting todo: ", error);
    }
  };

  return (
    <div>
      <h1>Welcome to our Todo App</h1>
      {user ? (
        <div>
          <p>Hello, {user.displayName}!</p>
          <form onSubmit={addTodo}>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo"
            />
            <button type="submit">Add</button>
          </form>
          <ul>
            {todos.map((todo) => (
              <li key={todo.id}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                />
                <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                  {todo.text}
                </span>
                <button onClick={() => deleteTodo(todo.id)}>Delete</button>
              </li>
            ))}
          </ul>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={handleSignIn}>Sign In with Google</button>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LandingPage />
    </AuthProvider>
  );
}

export default App;