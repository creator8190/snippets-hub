# Realtime Review Queue Implementation

## Overview
The Review Queue now uses Supabase Realtime to provide instant updates when authors extract snippets. Students see new submissions appear in real-time without page refresh.

## Implementation Details

### Supabase Realtime Subscription
- **Channel:** `review_queue_realtime`
- **Event Types:**
  - `INSERT` - New snippet extracted and submitted
  - `UPDATE` - Review claimed (status → in_progress)
  - `UPDATE` - Review approved (status → approved)

### Real-time Features

#### 1. Instant New Item Detection
- When an author extracts text and submits to review queue
- Realtime subscription detects the INSERT event
- Automatically fetches full snippet and author data
- Adds to review queue with proper sorting (oldest first)

#### 2. Visual Feedback
- **LIVE Badge:** Green pulsing dot with "LIVE" text in header
- **NEW Badge:** Green "NEW" badge on newly arrived items
- **Pulse Animation:** New items pulse with green glow for 3 seconds
- **Auto-removal:** Items disappear when claimed or approved by other editors

#### 3. Automatic Queue Management
- New items are automatically added to the queue
- Items are removed when:
  - Claimed by any editor (status → in_progress)
  - Approved by any editor (status → approved)
- Queue maintains chronological order (oldest first)

## Code Structure

### Realtime Subscription Setup
```typescript
useEffect(() => {
  if (!user || profile?.role !== 'editor') return;
  
  const channel = supabase
    .channel('review_queue_realtime')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'review_queue',
      filter: 'status=eq.pending'
    }, async (payload) => {
      // Handle new item
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [user, profile?.role]);
```

### Event Handlers

#### INSERT Handler
- Fetches snippet data with author profile
- Enriches review object with full data
- Adds to queue with sorting
- Triggers pulse animation

#### UPDATE Handlers
- Removes items when claimed (in_progress)
- Removes items when approved
- Keeps queue synchronized across all editors

## User Experience

### For Students (Editors)
1. Open Review Queue view
2. See "LIVE" indicator confirming realtime connection
3. New items appear instantly when authors extract snippets
4. Visual feedback (pulse, NEW badge) highlights new arrivals
5. Items automatically disappear when claimed/approved

### For Authors
1. Extract text from editor
2. Snippet automatically submitted to review queue
3. Students see it instantly (no delay)
4. No action needed - fully automated

## Performance Considerations

- **Subscription Cleanup:** Properly unsubscribes on component unmount
- **Conditional Subscription:** Only active for student editors
- **Efficient Filtering:** Uses Supabase filters (status=eq.pending)
- **Data Enrichment:** Fetches related data only when needed
- **State Management:** Maintains sorted queue order

## Testing Checklist

- [ ] Author extracts snippet → Appears in student queue instantly
- [ ] Multiple students see same new item simultaneously
- [ ] Student claims review → Item disappears for all students
- [ ] Student approves review → Item disappears for all students
- [ ] LIVE badge shows when subscription active
- [ ] NEW badge appears on new items
- [ ] Pulse animation works correctly
- [ ] Subscription cleans up on logout
- [ ] No memory leaks from subscriptions

## Technical Notes

- Uses Supabase Postgres Changes (not presence)
- Filters at database level for efficiency
- Handles race conditions with proper state updates
- Maintains chronological order for fairness
- Visual feedback enhances user awareness

## Future Enhancements

- Sound notification for new items (optional)
- Desktop notifications for new submissions
- Queue position indicator
- Estimated wait time
- Priority queue for premium authors

