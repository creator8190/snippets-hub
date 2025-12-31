# The Review Bridge Module - Implementation Summary

## Overview
The Review Bridge is the core logic-heavy module that enables the Student-Author handshake workflow. This is the first critical module that unlocks the unique value proposition of the platform.

## Database Schema Changes

### New Table: `review_queue`
- Tracks review submissions and their lifecycle
- Fields: id, snippet_id, author_id, editor_id, status, submitted_at, reviewed_at, editor_notes, edited_content
- Includes RLS policies for security
- Database triggers automatically award credits and mark snippets as verified on approval

### Updated Table: `snippets`
- Added `verified` boolean field
- Added `verification_status` enum (draft, pending_review, in_review, verified, rejected)

**See `supabase_migration_review_bridge.sql` for complete SQL migration script.**

## Frontend Implementation

### New State Variables
- `reviewQueue`: List of pending reviews for student editors
- `selectedReview`: Currently active review being processed
- `reviewContent`: Editable content in review terminal
- `reviewNotes`: Editor notes for approval/rejection
- `pendingReviews`: Author's submitted reviews with status tracking
- `editingSnippetId`: Tracks which snippet is being edited

### New Functions

#### For Authors:
1. **`saveDraft()`**: Saves snippet as draft (status: 'draft')
2. **`submitForReview(snippetId)`**: Submits draft to review queue (changes status to 'pending_review')
3. **`commitAssetToMarket()`**: Updated to save draft then submit for review

#### For Student Editors:
1. **`loadReviewQueue()`**: Fetches all pending reviews
2. **`claimReview(reviewId)`**: Claims a review, assigns it to the editor, changes status to 'in_progress'
3. **`approveReview()`**: Approves review, awards +1 credit, marks snippet as verified
4. **`rejectReview()`**: Rejects review with notes, returns snippet to draft status

### New Views

#### 1. Review Queue View (Students)
- Shows all pending manuscripts awaiting verification
- Displays preview, author name, price, submission date
- "Claim Review" button to start reviewing
- Empty state when no reviews available

#### 2. Review Terminal View (Students)
- Full-screen editing interface
- Shows original manuscript content (editable)
- Editor notes textarea (required for rejection)
- Approve/Reject buttons
- Back button to return to queue
- Real-time word count

#### 3. Updated Write Terminal (Authors)
- "Save Draft" button (saves as draft)
- "Submit for Review" button (replaces old "Publish IP")
- Works with existing snippet editing flow

#### 4. Updated Profile/Vault View (Authors)
- Shows review status badges for each snippet:
  - Draft (gray)
  - Pending Review (blue)
  - In Review (yellow)
  - Approved (green)
  - Rejected (red)
  - Verified (green with checkmark)
- "Submit for Review" button for draft snippets
- Shows editor notes on rejected items
- Edit button for draft snippets

#### 5. Updated Marketplace
- Now filters to show ONLY verified snippets (`verified = true`)
- Displays verified badge on each item
- Green checkmark indicator

### Navigation Updates
- Added Review Queue button (📋) to sidebar (only visible for student editors)
- Conditional rendering based on user role

## Workflow

### Author Flow:
1. Write manuscript in Write Terminal
2. Click "Save Draft" (optional, auto-saves)
3. Click "Submit for Review"
4. Snippet moves to 'pending_review' status
5. Wait for student editor review
6. Once approved, snippet becomes verified and appears in marketplace
7. If rejected, can edit and resubmit

### Student Editor Flow:
1. Navigate to Review Queue (📋 in sidebar)
2. See list of pending manuscripts
3. Click "Claim Review (+1 Credit)"
4. Review opens in Review Terminal
5. Edit content if needed (optional)
6. Add notes (required for rejection)
7. Click "Approve (+1 Credit)" or "Reject"
8. On approval: +1 credit awarded, snippet verified, appears in marketplace
9. On rejection: snippet returned to draft, author notified with notes

## Credit System
- Credits are awarded via database trigger on approval
- Automatic increment: `credits = credits + 1`
- Displayed in profile stats for editors

## Security & Permissions
- Row Level Security (RLS) policies implemented
- Students can only view pending reviews
- Authors can only view their own submissions
- Editors can only update reviews they're assigned to

## Code Statistics
- **~500+ lines** of new logic added
- **8 new functions** for review workflow
- **2 new views** (Review Queue, Review Terminal)
- **Multiple updated views** (Write, Profile, Marketplace)
- **Full state management** for review lifecycle

## Next Steps
1. Execute SQL migration in Supabase SQL Editor
2. Test author submission flow
3. Test student review flow
4. Verify credit awarding works
5. Test verification badges in marketplace
6. Implement real-time notifications (next module)
7. Add license generator (future module)

