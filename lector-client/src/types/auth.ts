export type User = {
  email: string;
  userName: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  email: string;
  accessTokenExpires: string;
};
