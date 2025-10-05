// src/lib/store.ts

const KEY = 'merlin_project_v1';

export type ProjectSnapshot = {
  name: string;
  createdAt: string;
  inputs: any;
  assumptions: any;
};

export function loadAll(): ProjectSnapshot[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveProject(snap: ProjectSnapshot) {
  const all = loadAll();
  all.unshift(snap);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)));
}

export function deleteProject(name: string) {
  const all = loadAll().filter(p => p.name !== name);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function updateProject(name: string, patch: Partial<ProjectSnapshot>) {
  const all = loadAll();
  const idx = all.findIndex(p => p.name === name);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...patch, name: patch.name ?? all[idx].name };
    localStorage.setItem(KEY, JSON.stringify(all));
  }
}
