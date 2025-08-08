# Green Box Barbados - Vegan Food Delivery

A modern web application for "It's Worth Eating" (Green Box Barbados), a 100% vegan food delivery service in Barbados. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- 🔐 **User Authentication** - Sign up/sign in with email and password
- 📦 **Order Management** - Interactive menu selection with quantity and add-ons
- 🖼️ **Weekly Menu Images** - Dynamic menu display with admin upload capability
- 👤 **User Profiles** - Manage dietary restrictions and preferences
- 📱 **Responsive Design** - Mobile-first design with Tailwind CSS
- 🎯 **Personalized Experience** - Auto-applied user preferences during ordering

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Authentication & Database**: Supabase
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd greenbox-barbados
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase Database**
   
   Follow the instructions in [DATABASE_SETUP.md](./DATABASE_SETUP.md) to:
   - Create the required database tables
   - Set up Row Level Security (RLS) policies
   - Insert sample menu data
   - Configure storage buckets

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Authentication page
│   ├── order-now/         # Order form page
│   ├── account/           # User profile page
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── Navigation.tsx     # Main navigation component
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
└── lib/                   # Utility libraries
    └── supabase.ts        # Supabase client configuration
```

## Key Features Implementation

### Authentication Flow
- User registration and login with email/password
- Automatic profile creation on signup
- Protected routes for authenticated users
- User dropdown with logout functionality

### Order System
- Interactive menu selection with quantity controls
- Add-on selection for each menu item
- Special instructions per item
- Order summary with total calculation
- User preference auto-application

### User Profiles
- Dietary restrictions management
- Order preferences storage
- Profile information editing
- Automatic preference application during ordering

### Weekly Menu Management
- Admin upload capability for weekly menu images
- Dynamic display of current week's menu
- Fallback handling for missing images

## Database Schema

The application uses the following Supabase tables:

- `user_profiles` - User information and preferences
- `menu_items` - Available menu items
- `weekly_menus` - Weekly menu images
- `orders` - Customer orders with items and status

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed schema and setup instructions.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email hello@greenboxbarbados.com or create an issue in this repository.

---

Built with ❤️ for Green Box Barbados
