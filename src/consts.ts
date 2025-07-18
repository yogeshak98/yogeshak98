import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Yogesha K",
  EMAIL: "yogesha.k.98b@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_WORKS_ON_HOMEPAGE: 4,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "A minimal and lightweight blog and portfolio.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "A collection of articles on topics I am passionate about.",
};

export const WORK: Metadata = {
  TITLE: "Work",
  DESCRIPTION: "Where I have worked and what I have done.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION: "A collection of my projects, with links to repositories and demos.",
};

export const SOCIALS: Socials = [
  { 
    NAME: "GitHub (Personal)",
    HREF: "https://github.com/yogeshak98"
  },
  { 
    NAME: "GitHub (Work)",
    HREF: "https://github.com/kyogesha"
  },
  { 
    NAME: "LinkedIn",
    HREF: "https://linkedin.com/in/yogesha-k-851a9014a",
  },
  {
    NAME: "Stack Overflow",
    HREF: "https://stackoverflow.com/users/12230718/yogesh",
  },
  {
    NAME: "LeetCode",
    HREF: "https://leetcode.com/u/yogeshak/",
  }
];
