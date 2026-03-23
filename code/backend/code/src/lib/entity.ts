/**
 * @property {string} id - unique identifier (_pk)
 * @property {string} createdBy - PID of the user that created application
 * @property {string} updatedBy - PID of the user that last updated application
 * @property {number} createdAt - when application created
 * @property {string} createdOn - date when application created
 * @property {number} updatedAt - when application last time updated
 * @property {string} updatedOn - date when application last time updated
 */
export interface Entity {
  id?: string;

  createdBy?: string;
  updatedBy?: string;

  createdAt?: number;
  createdOn?: string;

  updatedAt?: number;
  updatedOn?: string;
}

export function currentAt(): number {
  return Date.now();
}

export function currentOn(): string {
  return new Date().toISOString().substring(0, 10);
}
