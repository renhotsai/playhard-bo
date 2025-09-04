import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { withOrganizationAccess } from '@/lib/api-auth';

const prisma = new PrismaClient();

export const GET = withOrganizationAccess(async (
  request: NextRequest, 
  _session,
  { params }: { params: Promise<{ organizationId: string }> }
) => {
    const { organizationId } = await params;

    // Fetch stores for the organization
    const stores = await prisma.store.findMany({
      where: {
        organizationId: organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ stores });
});

export const POST = withOrganizationAccess(async (
  request: NextRequest,
  _session, 
  { params }: { params: Promise<{ organizationId: string }> }
) => {
    const { organizationId } = await params;

    // Get request body
    const body = await request.json();
    const {
      name,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
      isActive
    } = body;

    // Basic validation
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    }

    if (!address?.trim()) {
      return NextResponse.json({ error: 'Store address is required' }, { status: 400 });
    }

    // Create new store
    const newStore = await prisma.store.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        city: city?.trim() || null,
        state: state?.trim() || null,
        zipCode: zipCode?.trim() || null,
        country: country || 'TW',
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        isActive: Boolean(isActive),
        organizationId: organizationId,
      },
    });

    return NextResponse.json({
      message: 'Store created successfully',
      store: newStore,
    }, { status: 201 });
});