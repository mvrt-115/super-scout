import React, {
    useContext,
    useState,
    useEffect,
    createContext,
    FC,
} from 'react';
import firebase, { auth } from '../firebase';

interface ValueData {
    currentUser: firebase.User | null | undefined;
    login: (email: string, password: string) => any;
    signup: (email: string, password: string) => any;
    logout: () => void;
    loggedIn: boolean;
}

const initValue: ValueData = {
    currentUser: undefined,
    login: (email: string, password: string) => {},
    signup: (email: string, password: string) => {},
    logout: () => {},
    loggedIn: false,
};

const AuthContext = createContext(initValue);

const useAuth = () => {
    return useContext(AuthContext);
};

const AuthProvider: FC = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<firebase.User | null>();
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);

    const signup = (email: string, password: string) => {
        return auth.createUserWithEmailAndPassword(email, password);
    };

    const login = (email: string, password: string) => {
        return auth.signInWithEmailAndPassword(email, password);
    };

    const logout = () => {
        return auth.signOut();
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => setLoggedIn(!!currentUser), [currentUser]);

    const value = {
        currentUser,
        login,
        signup,
        logout,
        loggedIn,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export { AuthProvider, useAuth };
