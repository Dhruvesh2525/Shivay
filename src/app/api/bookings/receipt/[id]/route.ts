// src/app/api/bookings/receipt/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// Define PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#0A0F0D',
    color: '#F0FDF4',
    fontFamily: 'Helvetica',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A2B',
    paddingBottom: 15,
    marginBottom: 15,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34D399',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 8,
    color: '#6B8F7E',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
    color: '#34D399',
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6B8F7E',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A2B',
    paddingBottom: 4,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 9,
  },
  label: {
    color: '#A7C4B8',
  },
  value: {
    fontWeight: 'bold',
    color: '#F0FDF4',
  },
  facilityInfo: {
    fontSize: 8,
    color: '#6B8F7E',
    marginTop: 6,
    lineHeight: 1.3,
  },
});

interface ReceiptDocProps {
  booking: any;
  profile: any;
}

// React PDF Document structure built using pure React.createElement
const ReceiptDocument = ({ booking, profile }: ReceiptDocProps) => {
  return React.createElement(Document, {}, 
    React.createElement(Page, { size: 'A6', style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.brandName }, 'SHIVAY'),
        React.createElement(Text, { style: styles.tagline }, 'The Cricketing Hub - Box Cricket & Pickleball')
      ),
      
      // Title
      React.createElement(Text, { style: styles.title }, 'BOOKING RECEIPT'),

      // Booking Details
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Booking Details'),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Booking ID:'),
          React.createElement(Text, { style: styles.value }, booking.booking_id)
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Court:'),
          React.createElement(Text, { style: styles.value }, booking.courts.name)
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Date:'),
          React.createElement(Text, { style: styles.value }, booking.booking_date)
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Time Slot:'),
          React.createElement(Text, { style: styles.value }, `${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)}`)
        )
      ),

      // Customer Info
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Customer Details'),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Name:'),
          React.createElement(Text, { style: styles.value }, profile.full_name)
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Phone:'),
          React.createElement(Text, { style: styles.value }, profile.phone)
        )
      ),

      // Payment Details
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Payment Details'),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Base Price:'),
          React.createElement(Text, { style: styles.value }, `INR ${booking.base_price}`)
        ),
        booking.discount_amount > 0 ? React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Discount:'),
          React.createElement(Text, { style: styles.value }, `- INR ${booking.discount_amount}`)
        ) : null,
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Total Paid:'),
          React.createElement(Text, { style: [styles.value, { color: '#34D399' }] }, `INR ${booking.final_price}`)
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Payment ID:'),
          React.createElement(Text, { style: styles.value }, booking.payment_id || 'N/A')
        )
      ),

      // Contact Footer
      React.createElement(View, { style: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#1E3A2B', paddingTop: 8 } },
        React.createElement(Text, { style: styles.facilityInfo }, 'Address: Shivay Box Cricket and Pickleball, Karai Dam Road, Karai, Gujarat 382330'),
        React.createElement(Text, { style: styles.facilityInfo }, 'Phone: +91 99981 68681 | Instagram: @shivay_thecricketinghub')
      )
    )
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminSupabase = createAdminClient();

    // Fetch booking details
    const { data: booking, error: bookingError } = await adminSupabase
      .from('bookings')
      .select('*, courts(name)')
      .eq('id', id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking receipt not found.' }, { status: 404 });
    }

    // Fetch profile details
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', booking.user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Customer profile not found.' }, { status: 404 });
    }

    // Stream out the generated PDF document
    const blob = await pdf(React.createElement(ReceiptDocument, { booking, profile }) as any).toBlob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Receipt-${booking.booking_id}.pdf`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Receipt compilation failed.' }, { status: 500 });
  }
}
