export interface CurrentUser {
  name: string;
  email: string;
  image?: string;
  favoriteIds: string[];
}

export interface RegisteredUser extends CurrentUser {
  password: string;
}

const USERS_KEY = "otaku-users";

export const getUsers = (): RegisteredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const saveUsers = (users: RegisteredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const registerUser = (
  name: string,
  email: string,
  password: string
): CurrentUser => {
  const users = getUsers();
  if (users.some((user) => user.email === email)) {
    throw new Error("Email already in use");
  }
  const registered: RegisteredUser = { name, email, password, favoriteIds: [] };
  users.push(registered);
  saveUsers(users);
  const { password: _password, ...safe } = registered;
  return safe;
};

export const findUser = (
  email: string,
  password: string
): CurrentUser | null => {
  const registered = getUsers().find(
    (user) => user.email === email && user.password === password
  );
  if (!registered) {
    return null;
  }
  const { password: _password, ...safe } = registered;
  return safe;
};
