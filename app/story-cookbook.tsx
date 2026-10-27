// ─── app/story-cookbook.tsx ─────────────────────────────────────────────────────
// One of the seven rooms app/stories.tsx has pointed at since it was written.
// The door existed; the room did not. Built 2026-10-27.
import React from 'react';
import { StoryRoom } from '@/components/StoryRoom';
import { STORY_ROOMS } from '@/lib/story-rooms';

export default function StoryCookbookScreen() {
  return <StoryRoom story={STORY_ROOMS.cookbook} />;
}
