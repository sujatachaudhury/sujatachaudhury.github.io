/**
 * Work history. Each entry references translation keys under the "work" namespace.
 * Dates are ISO to be locale-formatted at render time.
 */

export interface Role {
  id: string;
  key: string;
  bulletCount: number;
  start: string;
  end: string | null;
}

export const roles: Role[] = [
  { id: "optum",         key: "roles.optum",        bulletCount: 3, start: "2021-06-01", end: "2024-08-01" },
  { id: "internSummer",  key: "roles.internSummer", bulletCount: 0, start: "2020-05-01", end: "2020-07-01" },
  { id: "internIIT",     key: "roles.internIIT",    bulletCount: 0, start: "2019-05-01", end: "2019-07-01" },
];

export interface Degree {
  id: string;
  key: string;
  start: string;
  end: string | null;
}

export const degrees: Degree[] = [
  { id: "msc",   key: "degrees.msc",   start: "2024-09-01", end: null },
  { id: "btech", key: "degrees.btech", start: "2017-08-01", end: "2021-06-01" },
];

export interface Publication {
  id: string;
  key: string;
  href: string;
}

export const publications: Publication[] = [
  {
    id: "rnn",
    key: "publications.rnn",
    href: "https://ieeexplore.ieee.org/abstract/document/9641626",
  },
];
