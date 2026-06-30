export type Message = {
  role: "user" | "assistant";
  content: string;
  tool?: string | null;
};
