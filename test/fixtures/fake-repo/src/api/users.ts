export interface User {
  id: string;
  name: string;
}

export async function getUsers(): Promise<User[]> {
  return [
    { id: "user-1", name: "Ada" },
    { id: "user-2", name: "Grace" }
  ];
}
