"""Initial migration

Revision ID: 0001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tenants table
    op.create_table('tenants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('website_url', sa.String(length=500), nullable=True),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('contact_phone', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tenants_id'), 'tenants', ['id'], unique=False)
    op.create_index(op.f('ix_tenants_slug'), 'tenants', ['slug'], unique=True)

    # Create tenant_domains table
    op.create_table('tenant_domains',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('host', sa.String(length=255), nullable=False),
        sa.Column('status', sa.Enum('PENDING_DNS', 'LIVE', 'DISABLED', name='tenantdomainstatus'), nullable=True),
        sa.Column('is_primary', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tenant_domains_id'), 'tenant_domains', ['id'], unique=False)
    op.create_index(op.f('ix_tenant_domains_host'), 'tenant_domains', ['host'], unique=False)

    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=True),
        sa.Column('last_name', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create memberships table
    op.create_table('memberships',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.Enum('PLATFORM_ADMIN', 'NGO_ADMIN', 'NGO_STAFF', 'VENDOR', 'DONOR', name='membershiprole'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_memberships_id'), 'memberships', ['id'], unique=False)

    # Create categories table
    op.create_table('categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)

    # Create causes table
    op.create_table('causes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('goal_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('raised_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('type', sa.Enum('VENDOR', 'NGO_MANAGED', name='causetype'), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'LIVE', 'FUNDED', 'FULFILLED', 'CLOSED', name='causestatus'), nullable=True),
        sa.Column('policy_flags_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_causes_id'), 'causes', ['id'], unique=False)

    # Create donations table
    op.create_table('donations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cause_id', sa.Integer(), nullable=False),
        sa.Column('donor_user_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('pg_order_id', sa.String(length=255), nullable=True),
        sa.Column('pg_payment_id', sa.String(length=255), nullable=True),
        sa.Column('pg_signature', sa.String(length=500), nullable=True),
        sa.Column('status', sa.Enum('INIT', 'CAPTURED', 'REFUNDED', 'FAILED', name='donationstatus'), nullable=True),
        sa.Column('audit_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['cause_id'], ['causes.id'], ),
        sa.ForeignKeyConstraint(['donor_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_donations_id'), 'donations', ['id'], unique=False)

    # Create vendors table
    op.create_table('vendors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('gstin', sa.String(length=15), nullable=True),
        sa.Column('bank_json', sa.JSON(), nullable=True),
        sa.Column('kyc_status', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendors_id'), 'vendors', ['id'], unique=False)

    # Create vendor_links table
    op.create_table('vendor_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cause_id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=False),
        sa.Column('terms_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['cause_id'], ['causes.id'], ),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendor_links_id'), 'vendor_links', ['id'], unique=False)

    # Create vendor_invoices table
    op.create_table('vendor_invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cause_id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=False),
        sa.Column('number', sa.String(length=100), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('files', sa.JSON(), nullable=True),
        sa.Column('status', sa.Enum('SUBMITTED', 'NGO_APPROVED', 'PAID', 'REJECTED', name='invoicestatus'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['cause_id'], ['causes.id'], ),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendor_invoices_id'), 'vendor_invoices', ['id'], unique=False)

    # Create ngo_receipts table
    op.create_table('ngo_receipts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cause_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('files', sa.JSON(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('SUBMITTED', 'ADMIN_APPROVED', 'REJECTED', name='receiptstatus'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['cause_id'], ['causes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ngo_receipts_id'), 'ngo_receipts', ['id'], unique=False)

    # Create payouts table
    op.create_table('payouts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('to_type', sa.Enum('VENDOR', 'NGO', name='payouttotype'), nullable=False),
        sa.Column('to_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('pg_payout_id', sa.String(length=255), nullable=True),
        sa.Column('status', sa.Enum('INIT', 'QUEUED', 'PROCESSED', 'FAILED', name='payoutstatus'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payouts_id'), 'payouts', ['id'], unique=False)

    # Create documents table
    op.create_table('documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('url', sa.String(length=1000), nullable=False),
        sa.Column('hash_sha256', sa.String(length=64), nullable=False),
        sa.Column('uploaded_by', sa.Integer(), nullable=False),
        sa.Column('purpose', sa.String(length=255), nullable=True),
        sa.Column('signed_by', sa.Integer(), nullable=True),
        sa.Column('signed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['signed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)
    op.create_index(op.f('ix_documents_hash_sha256'), 'documents', ['hash_sha256'], unique=False)

    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('entity', sa.String(length=100), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('before_json', sa.JSON(), nullable=True),
        sa.Column('after_json', sa.JSON(), nullable=True),
        sa.Column('ts', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)

    # Create tenant_policies table
    op.create_table('tenant_policies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('allow_ngo_managed', sa.Boolean(), nullable=True),
        sa.Column('ngo_managed_monthly_cap_percent', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tenant_policies_id'), 'tenant_policies', ['id'], unique=False)


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_table('tenant_policies')
    op.drop_table('audit_logs')
    op.drop_table('documents')
    op.drop_table('payouts')
    op.drop_table('ngo_receipts')
    op.drop_table('vendor_invoices')
    op.drop_table('vendor_links')
    op.drop_table('vendors')
    op.drop_table('donations')
    op.drop_table('causes')
    op.drop_table('categories')
    op.drop_table('memberships')
    op.drop_table('users')
    op.drop_table('tenant_domains')
    op.drop_table('tenants')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS tenantdomainstatus')
    op.execute('DROP TYPE IF EXISTS membershiprole')
    op.execute('DROP TYPE IF EXISTS causetype')
    op.execute('DROP TYPE IF EXISTS causestatus')
    op.execute('DROP TYPE IF EXISTS donationstatus')
    op.execute('DROP TYPE IF EXISTS invoicestatus')
    op.execute('DROP TYPE IF EXISTS receiptstatus')
    op.execute('DROP TYPE IF EXISTS payouttotype')
    op.execute('DROP TYPE IF EXISTS payoutstatus')
