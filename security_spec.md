# Security Specification - Learners Pass

## Data Invariants
1. A note must always be associated with a valid user UID.
2. Quizzes are derived from notes and must maintain relational integrity with both the note and the user.
3. User profiles (streaks, points) can only be incremented/updated by the user themselves through their own UID document.
4. Admin features (monitored content) require explicit admin privileges stored in a trusted collection.

## 12 "Dirty Dozen" Payloads (Rejected)
1. Attempting to create a note with another user's `userId`.
2. Attempting to update the `points` of another user.
3. Injecting a 1MB string into a `subject` field of a note.
4. Deleting a note that doesn't belong to the requester.
5. Creating a quiz result for a quiz that doesn't exist.
6. Reading the `private` PII of another student.
7. Modifying AI-generated `contentSummary` which should be immutable for students.
8. Escalating privilege by setting `role: 'admin'` on a user profile.
9. Listing all notes in the database (querying without `userId` filter).
10. Updating `streak` without being the owner.
11. Setting `createdAt` to a future date manually.
12. Attempting to write to a collection not defined in the schema.

## Security Controls
- **Attribute-Based Access Control (ABAC)** powered by document `userId`.
- **Schema Validation** for all document structures via `isValid[Entity]` helpers.
- **Master Gate** pattern for all sub-resource access.
- **Strict Keys** enforcement using `affectedKeys().hasOnly()`.
