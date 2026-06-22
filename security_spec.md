# Security Specification for QMS@DTE

## Data Invariants
1. A project must have a valid `ownerEmail`.
2. Only Admins can delete documents or audits.
3. Contributors can only update projects they own.
4. Viewers have zero write access.
5. Audits are immutable once created (except for admins maybe, but primarily create-only).

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a project with `ownerEmail` as someone else. -> `PERMISSION_DENIED`
2. **Privilege Escalation**: Attempt to update own user profile to `role: 'Admin'`. -> `PERMISSION_DENIED`
3. **Ghost Projects**: Attempt to delete a project when role is `Viewer`. -> `PERMISSION_DENIED`
4. **Unauthorized Update**: Contributor tries to update status of someone else's project. -> `PERMISSION_DENIED`
5. **Admin Bypass**: Attempt to delete an audit trail without being an Admin. -> `PERMISSION_DENIED`
6. **Malformed Data**: Create a project with progress > 100 or negative. -> `PERMISSION_DENIED` (if using numeric validation)
7. **Resource Exhaustion**: Document name > 500 chars. -> `PERMISSION_DENIED`
8. **PII Leak**: Viewer attempting to read private user profiles (if any were private). -> `PERMISSION_DENIED`
9. **Relational Sync**: Create a sub-resource for a project that doesn't exist. -> `PERMISSION_DENIED`
10. **State Shortcutting**: Skipping status steps if logic is enforced (not strictly requested but good).
11. **Shadow Field Injection**: Adding an `isAdmin: true` field to a project document. -> `PERMISSION_DENIED`
12. **Null Pointers**: Read document as unauthenticated user. -> `PERMISSION_DENIED`

## The Test Runner (Plan)
We will verify that:
- `allow read: if isSignedIn()` for all collections.
- `allow write: if isAdmin()` for audits.
- `allow create: if isContributor() || isAdmin()` for projects.
- `allow update: if isOwner(projectId) || isAdmin()` for projects.
