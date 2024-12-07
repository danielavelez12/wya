import React, { createContext, useContext, useEffect, useState } from "react";

import { fetchUserById, fetchUsers } from "../api"; // Import your API function

const UserContext = createContext();

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeUsers = async () => {
      try {
        setIsLoading(true);
        const usersList = await fetchUsers();
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUsers();
  }, []);

  const initializeCurrentUser = async (userId) => {
    try {
      const userData = await fetchUserById(userId);
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  };

  const updateUserPreference = (userId, field, value) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.clerk_user_id === userId ? { ...user, [field]: value } : user
      )
    );

    if (currentUser?.clerk_user_id === userId) {
      setCurrentUser((prev) => ({ ...prev, [field]: value }));
    }
  };

  const getUserById = (userId) => {
    return users.find((user) => user.clerk_user_id === userId);
  };

  const blockUser = (blockerId, blockedId) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.clerk_user_id === blockerId) {
          // Add blockedId to blocker's blocked list
          const blocked = user.blocked || [];
          return { ...user, blocked: [...new Set([...blocked, blockedId])] };
        }
        if (user.clerk_user_id === blockedId) {
          // Add blockerId to blocked user's blockedBy list
          const blockedBy = user.blockedBy || [];
          return {
            ...user,
            blockedBy: [...new Set([...blockedBy, blockerId])],
          };
        }
        return user;
      })
    );

    // Update currentUser if they're the blocker
    if (currentUser?.clerk_user_id === blockerId) {
      setCurrentUser((prev) => ({
        ...prev,
        blocked: [...new Set([...(prev.blocked || []), blockedId])],
      }));
    }
  };

  return (
    <UserContext.Provider
      value={{
        users,
        setUsers,
        currentUser,
        setCurrentUser,
        updateUserPreference,
        getUserById,
        isLoading,
        initializeCurrentUser,
        blockUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
}
