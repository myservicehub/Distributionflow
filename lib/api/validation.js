import { z } from 'zod'
import { NextResponse } from 'next/server'

// Nigerian phone number validation
export const NigerianPhone = z.string().regex(
  /^(\+234|0)[789][01]\d{8}$/,
  'Invalid Nigerian phone number (format: 0801234567 or +2348012345678)'
)

// Retailer schemas
// Base retailer schema without transform
const BaseRetailerSchema = z.object({
  shop_name: z.string().min(1, 'Shop name is required').max(255, 'Shop name too long'),
  owner_name: z.string().min(1, 'Owner name is required').max(255, 'Owner name too long'),
  phone: NigerianPhone.optional().nullable().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().max(500, 'Address too long').optional().nullable().or(z.literal('')),
  assigned_rep_id: z.string().uuid('Invalid rep ID').optional().nullable().or(z.literal('')),
  credit_limit: z.coerce.number().min(0, 'Credit limit cannot be negative').default(0),
  status: z.enum(['active', 'inactive']).optional().default('active')
})

// Create schema with transform to clean up empty strings
export const CreateRetailerSchema = BaseRetailerSchema.transform((data) => ({
  ...data,
  // Convert empty strings to null for optional UUID/text fields
  assigned_rep_id: data.assigned_rep_id === '' ? null : data.assigned_rep_id,
  phone: data.phone === '' ? null : data.phone,
  email: data.email === '' ? null : data.email,
  address: data.address === '' || !data.address ? null : data.address,
}))

// Update schema uses the base schema (without transform) so .partial() works
export const UpdateRetailerSchema = BaseRetailerSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional()
})

// Order schemas
export const CreateOrderSchema = z.object({
  retailer_id: z.string().uuid('Invalid retailer ID'),
  items: z.array(z.object({
    product_id: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Price cannot be negative'),
  })).min(1, 'At least one item is required'),
  payment_status: z.enum(['paid', 'unpaid', 'partial']).default('unpaid'),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

// Payment schemas  
export const CreatePaymentSchema = z.object({
  retailer_id: z.string().uuid('Invalid retailer ID'),
  amount: z.number().positive('Amount must be greater than 0'),
  payment_method: z.enum(['cash', 'bank_transfer', 'cheque', 'pos'], {
    errorMap: () => ({ message: 'Invalid payment method' })
  }),
  reference: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
})

// Staff schemas
export const CreateStaffSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'sales_rep', 'warehouse', 'driver'], {
    errorMap: () => ({ message: 'Invalid role. Must be admin, manager, sales_rep, warehouse, or driver' })
  }),
  phone: NigerianPhone.optional().nullable(),
})

// Product schemas
export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().max(100).optional().or(z.literal('')),
  unit_price: z.coerce.number().min(0, 'Price cannot be negative'),
  cost_price: z.coerce.number().min(0, 'Cost cannot be negative').optional(),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative').default(0),
  low_stock_threshold: z.coerce.number().int().min(0).default(10),
  description: z.string().max(1000).optional().or(z.literal('')),
  unit: z.string().max(50).optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
})

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
  empty_item_id: z.string().uuid('Invalid empty item ID').optional().nullable()
})

/**
 * Parse and validate request body against a Zod schema
 * Returns either validated data or an error response
 */
export function parseBody(schema, body) {
  const result = schema.safeParse(body)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    console.error('Validation failed:', {
      body,
      errors,
      issues: result.error.issues
    })
    return {
      error: NextResponse.json({
        error: 'Validation failed',
        details: errors,
        message: Object.entries(errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('; ')
      }, { status: 400 }),
      data: null
    }
  }
  return { error: null, data: result.data }
}
