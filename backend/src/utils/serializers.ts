export function publicUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export function authorPreview(user: {
  id: string;
  firstName: string;
  lastName: string;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}
