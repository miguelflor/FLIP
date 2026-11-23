import { invokeClip } from './useStudent';

export interface CourseFile {
  name: string;
  type_name: string;
  href: string;
  date: string;
  size: string;
  uploader: string;
}

/** Identifies a unit's documents pages, from the unit's CLIP link. */
export interface UnitParams {
  session_id: string;
  period: string;
  unit_id: string;
  year: string;
  type_period: string;
}

// Each unit's listing, kept for the session: its file links stay valid as long as it does.
// Promises, so a unit opened while its background preload is running waits for that one.
const listings = new Map<string, Promise<CourseFile[]>>();

/** The unit's files, from CLIP the first time and from memory after that. */
export function listCourseFiles(params: UnitParams, studentId: string): Promise<CourseFile[]> {
  const key = JSON.stringify([params.session_id, studentId, params.year, params.type_period, params.period, params.unit_id]);
  let listing = listings.get(key);
  if (!listing) {
    listing = invokeClip<CourseFile[]>('list_files', { params, studentId });
    // A failure isn't kept, so the next attempt asks CLIP again.
    listing.catch(() => listings.delete(key));
    listings.set(key, listing);
  }
  return listing;
}

/** Drops every remembered listing, so the next request for each fetches it anew. */
export function forgetCourseFiles() {
  listings.clear();
}
