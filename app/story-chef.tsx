// ─── app/story-chef.tsx ─────────────────────────────────────────────────────
// One of the seven rooms app/stories.tsx has pointed at since it was written.
// The door existed; the room did not. Built 2026-10-27.
import React from 'react';
import { StoryRoom } from '@/components/StoryRoom';
import { STORY_ROOMS } from '@/lib/story-rooms';

export default function StoryChefScreen() {
  return <StoryRoom story={STORY_ROOMS.chef} />;
}
