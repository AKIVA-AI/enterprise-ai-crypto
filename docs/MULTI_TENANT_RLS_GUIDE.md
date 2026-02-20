# Multi-Tenant RLS Implementation Guide

## Overview

The Enterprise Crypto platform now implements **multi-tenant Row Level Security (RLS)** to ensure data isolation between different organizations/tenants. This guide explains how the system works and how to work with it.

## Architecture

### Core Tables

1. **`tenants`** - Organizations/companies using the platform
2. **`user_tenants`** - Maps users to tenants with roles and default tenant setting
3. **`venues`** - Trading venues (now tenant-scoped)
4. **`strategies`** - Trading strategies (now tenant-scoped)
5. All new multi-tenant tables: `instruments`, `fees`, `funding_rates`, `basis_quotes`, etc.

### Key Function

```sql
public.current_tenant_id() -> UUID
```

Returns the current user's default tenant ID. Used in all RLS policies to enforce tenant isolation.

**Fallback Logic:**
1. Returns user's default tenant (`is_default = true`)
2. Falls back to user's oldest tenant if no default
3. Returns NULL if user has no tenants (should never happen)

## RLS Policies

### Venues Table

| Policy Name | Operation | Who | Condition |
|------------|-----------|-----|-----------|
| Tenant members can view venues | SELECT | authenticated | `tenant_id = current_tenant_id()` |
| Tenant admins can manage venues | ALL | authenticated | `tenant_id = current_tenant_id()` AND role in (admin, cio, ops) |
| Service role full access | ALL | service_role | Always true |

### Strategies Table

| Policy Name | Operation | Who | Condition |
|------------|-----------|-----|-----------|
| Tenant members can view strategies | SELECT | authenticated | `tenant_id = current_tenant_id()` |
| Tenant traders can manage strategies | ALL | authenticated | `tenant_id = current_tenant_id()` AND role in (admin, cio, trader) |
| Service role full access | ALL | service_role | Always true |

### Leg Events Table

| Policy Name | Operation | Who | Condition |
|------------|-----------|-----|-----------|
| Tenant members can view leg_events | SELECT | authenticated | `tenant_id = current_tenant_id()` |
| Tenant members can insert leg_events | INSERT | authenticated | `tenant_id = current_tenant_id()` |
| Service role full access | ALL | service_role | Always true |

## Working with Multi-Tenant Data

### Frontend (Authenticated Users)

Users automatically see only their tenant's data. No special handling needed in queries:

```typescript
// This automatically filters by current_tenant_id()
const { data: venues } = await supabase
  .from('venues')
  .select('*');

// This also respects tenant isolation
const { data: strategies } = await supabase
  .from('strategies')
  .select('*')
  .eq('status', 'live');
```

### Backend (Service Role)

Backend services using the service_role key can access all tenants' data:

```typescript
// Service role sees ALL tenants' data
const { data: allVenues } = await supabaseAdmin
  .from('venues')
  .select('*');

// Filter by specific tenant when needed
const { data: tenantVenues } = await supabaseAdmin
  .from('venues')
  .select('*')
  .eq('tenant_id', specificTenantId);
```

### Creating New Records

Always include `tenant_id` when creating records:

```typescript
// Frontend - use current_tenant_id()
const { data, error } = await supabase
  .from('venues')
  .insert({
    name: 'Binance',
    tenant_id: (await supabase.rpc('current_tenant_id')).data,
    // ... other fields
  });

// Backend - specify tenant explicitly
const { data, error } = await supabaseAdmin
  .from('venues')
  .insert({
    name: 'Binance',
    tenant_id: tenantId,
    // ... other fields
  });
```

## User Management

### Adding a New User to a Tenant

```sql
-- Add user to tenant with role
INSERT INTO public.user_tenants (tenant_id, user_id, role, is_default)
VALUES (
  'tenant-uuid-here',
  'user-uuid-here',
  'trader'::app_role,
  true  -- Set as default tenant
);
```

### Changing User's Default Tenant

```sql
-- Unset current default
UPDATE public.user_tenants
SET is_default = false
WHERE user_id = 'user-uuid-here';

-- Set new default
UPDATE public.user_tenants
SET is_default = true
WHERE user_id = 'user-uuid-here'
  AND tenant_id = 'new-tenant-uuid-here';
```

### Creating a New Tenant

```sql
-- 1. Create tenant
INSERT INTO public.tenants (name)
VALUES ('New Organization')
RETURNING id;

-- 2. Add admin user to tenant
INSERT INTO public.user_tenants (tenant_id, user_id, role, is_default)
VALUES (
  'new-tenant-id',
  'admin-user-id',
  'admin'::app_role,
  true
);
```

## Common Queries

### Get Current User's Tenant

```sql
SELECT public.current_tenant_id();
```

### Get All Tenants for Current User

```sql
SELECT t.*, ut.role, ut.is_default
FROM public.tenants t
INNER JOIN public.user_tenants ut ON ut.tenant_id = t.id
WHERE ut.user_id = auth.uid();
```

### Get All Users in Current Tenant

```sql
SELECT u.id, u.email, p.full_name, ut.role
FROM auth.users u
INNER JOIN public.user_tenants ut ON ut.user_id = u.id
LEFT JOIN public.profiles p ON p.id = u.id
WHERE ut.tenant_id = public.current_tenant_id();
```

## Troubleshooting

### User Can't See Any Data

**Cause:** User has no tenant assigned or no default tenant set.

**Solution:**
```sql
-- Check user's tenants
SELECT * FROM public.user_tenants WHERE user_id = 'user-uuid';

-- If no results, add user to a tenant
INSERT INTO public.user_tenants (tenant_id, user_id, role, is_default)
VALUES ('tenant-uuid', 'user-uuid', 'viewer'::app_role, true);
```

### Backend Needs Cross-Tenant Access

**Cause:** Using authenticated user credentials instead of service_role.

**Solution:** Use the service_role key for backend operations that need cross-tenant access.

### RLS Policy Violation Error

**Cause:** Trying to access data from another tenant or missing tenant_id.

**Solution:**
- Ensure `tenant_id` is set on INSERT/UPDATE operations
- Verify user has access to the tenant
- Use service_role for admin operations

## Security Best Practices

1. **Never expose service_role key** to frontend/client code
2. **Always use authenticated role** for user-facing operations
3. **Validate tenant_id** on backend before operations
4. **Audit tenant access** regularly
5. **Use service_role sparingly** - only for admin/system operations

## Migration Status

✅ **Completed:**
- Default tenant created ("Default Organization")
- All existing users assigned to default tenant
- `venues` and `strategies` tables backfilled with tenant_id
- RLS policies updated to enforce tenant isolation
- Indexes added for performance
- `current_tenant_id()` function improved with fallback logic

## Support

For questions or issues:
1. Check verification queries in migration file
2. Review RLS policies: `SELECT * FROM pg_policies WHERE tablename IN ('venues', 'strategies');`
3. Contact platform team

