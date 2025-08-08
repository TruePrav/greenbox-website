# Google Maps API Setup Guide

This guide will help you set up Google Maps API integration for the GreenBox Barbados application.

## 🚨 Prerequisites

1. **Google Cloud Platform Account**: You need a Google Cloud Platform account
2. **Billing Enabled**: Google Maps API requires billing to be enabled
3. **Domain Verification**: Your domain needs to be verified for API key restrictions

## 📋 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project

### Step 2: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**

### Step 3: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the generated API key

### Step 4: Restrict API Key (Security)

1. Click on the created API key
2. Under **Application restrictions**, select **HTTP referrers (web sites)**
3. Add your domain(s):
   - `http://localhost:3000/*` (for development)
   - `https://yourdomain.com/*` (for production)
4. Under **API restrictions**, select **Restrict key**
5. Select these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### Step 5: Add API Key to Environment Variables

1. Create or update your `.env.local` file:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. Replace `your_api_key_here` with your actual API key

### Step 6: Update Database Schema

Run this SQL in your Supabase SQL Editor to add address fields:

```sql
-- Add address fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);
```

## 🔧 Features Implemented

### ✅ Google Maps Integration
- **Interactive Map**: Users can drag a pin to set their exact location
- **Address Autocomplete**: Google Places API provides address suggestions
- **Reverse Geocoding**: Converts coordinates to formatted addresses
- **Validation**: Ensures users select a valid location before registration

### ✅ Form Validation
- **Address Required**: Users must select a location on the map
- **Coordinate Storage**: Latitude and longitude are stored in hidden fields
- **Real-time Validation**: Form submission is disabled until valid address is selected

### ✅ User Experience
- **Responsive Design**: Map adapts to different screen sizes
- **Loading States**: Shows loading spinner while map initializes
- **Error Handling**: Displays helpful error messages
- **Barbados Focus**: Map defaults to Barbados center coordinates

## 🧪 Testing Your Setup

### 1. **Test API Key**
1. Start your Next.js app: `npm run dev`
2. Go to `/login` and click "Sign up"
3. Check if the map loads without errors

### 2. **Test Address Autocomplete**
1. Start typing an address in the address field
2. Verify that Google Places suggestions appear
3. Select an address and verify the map updates

### 3. **Test Map Interaction**
1. Drag the pin on the map to a different location
2. Verify the address field updates with the new location
3. Check that coordinates are stored in hidden fields

### 4. **Test Form Validation**
1. Try to submit the form without selecting an address
2. Verify that validation prevents submission
3. Select an address and verify form can be submitted

## 🚨 Common Issues & Solutions

### Issue: "Google Maps API error: RefererNotAllowedMapError"
**Solution**: Check your API key restrictions and ensure your domain is properly configured.

### Issue: "Google Maps API error: ApiNotActivatedMapError"
**Solution**: Enable the Maps JavaScript API in Google Cloud Console.

### Issue: "Google Maps API error: BillingNotEnabledMapError"
**Solution**: Enable billing for your Google Cloud project.

### Issue: Map doesn't load
**Solution**: 
1. Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
2. Verify the API key is correct and has proper restrictions
3. Check browser console for JavaScript errors

### Issue: Address autocomplete not working
**Solution**: Enable the Places API in Google Cloud Console.

## 📊 API Usage & Costs

### Free Tier Limits
- **Maps JavaScript API**: 28,500 map loads per month
- **Places API**: 1,000 requests per day
- **Geocoding API**: 2,500 requests per day

### Cost Optimization
- **Restrict API Key**: Only allow your domain to use the key
- **Enable Billing Alerts**: Set up alerts to monitor usage
- **Use Caching**: Consider caching geocoding results

## 🔒 Security Best Practices

1. **API Key Restrictions**: Always restrict your API key to your domain
2. **HTTPS Only**: Use HTTPS in production to secure API calls
3. **Monitor Usage**: Regularly check API usage in Google Cloud Console
4. **Key Rotation**: Consider rotating API keys periodically

## 📱 Mobile Responsiveness

The map component is fully responsive and works on:
- ✅ Desktop browsers
- ✅ Mobile browsers
- ✅ Tablet devices
- ✅ Touch interactions for pin dragging

## 🎯 Barbados-Specific Features

- **Default Center**: Map centers on Barbados (13.1939, -59.5432)
- **Country Restriction**: Address autocomplete restricted to Barbados
- **Local Addresses**: Optimized for Barbados address format

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] Billing enabled
- [ ] Required APIs enabled (Maps JavaScript, Places, Geocoding)
- [ ] API key created and restricted
- [ ] Environment variable set (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- [ ] Database schema updated with address fields
- [ ] Map loads without errors
- [ ] Address autocomplete works
- [ ] Pin dragging works
- [ ] Form validation works
- [ ] Address data is stored correctly

If you encounter any issues, check the browser console for error messages and verify all setup steps are completed correctly.


