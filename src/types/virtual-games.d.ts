declare module "virtual:games" {
  export interface Game {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    path: string;
    tags: string[];
  }

  export const games: Game[];
}
