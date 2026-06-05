/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      './pages/**/*.{js,jsx}',
      './components/**/*.{js,jsx}',
      './app/**/*.{js,jsx}',
      './src/**/*.{js,jsx}',
    ],
    prefix: "",
    theme: {
        container: {
                center: true,
                padding: '2rem',
                screens: {
                        '2xl': '1400px'
                }
        },
        extend: {
                colors: {
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        
                        // Modern Blue, Green, Gray Palette (Paystack-inspired)
                        primary: {
                                50: '#e6f0ff',
                                100: '#b3d9ff',
                                200: '#80c2ff',
                                300: '#4dabff',
                                400: '#1a94ff',
                                500: '#0078e6', // Main blue
                                600: '#0062bd',
                                700: '#004d94',
                                800: '#00386b',
                                900: '#002342',
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        
                        success: {
                                50: '#e6f9f0',
                                100: '#b3efd4',
                                200: '#80e5b8',
                                300: '#4ddb9c',
                                400: '#1ad180',
                                500: '#00ba68', // Main green
                                600: '#009b56',
                                700: '#007c44',
                                800: '#005d32',
                                900: '#003e20',
                                DEFAULT: 'hsl(var(--success))',
                        },
                        
                        neutral: {
                                50: '#f8f9fa',
                                100: '#f1f3f5',
                                200: '#e9ecef',
                                300: '#dee2e6',
                                400: '#ced4da',
                                500: '#adb5bd',
                                600: '#6c757d', // Main gray
                                700: '#495057',
                                800: '#343a40',
                                900: '#212529',
                        },
                        
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        sidebar: {
                                DEFAULT: 'hsl(var(--sidebar-background))',
                                foreground: 'hsl(var(--sidebar-foreground))',
                                primary: 'hsl(var(--sidebar-primary))',
                                'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                                accent: 'hsl(var(--sidebar-accent))',
                                'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                                border: 'hsl(var(--sidebar-border))',
                                ring: 'hsl(var(--sidebar-ring))'
                        }
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)',
                        xl: '1rem',
                        '2xl': '1.5rem',
                },
                fontFamily: {
                        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                },
                fontSize: {
                        'display-lg': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
                        'display-md': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
                        'display-sm': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
                },
                boxShadow: {
                        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
                        'medium': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
                        'strong': '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
                        'glow-primary': '0 0 20px rgba(0, 120, 230, 0.3)',
                        'glow-success': '0 0 20px rgba(0, 186, 104, 0.3)',
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to: { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to: { height: '0' }
                        },
                        fadeIn: {
                                '0%': { opacity: '0' },
                                '100%': { opacity: '1' },
                        },
                        slideUp: {
                                '0%': { transform: 'translateY(20px)', opacity: '0' },
                                '100%': { transform: 'translateY(0)', opacity: '1' },
                        },
                        slideDown: {
                                '0%': { transform: 'translateY(-20px)', opacity: '0' },
                                '100%': { transform: 'translateY(0)', opacity: '1' },
                        },
                        scaleIn: {
                                '0%': { transform: 'scale(0.9)', opacity: '0' },
                                '100%': { transform: 'scale(1)', opacity: '1' },
                        },
                        shimmer: {
                                '0%': { backgroundPosition: '-1000px 0' },
                                '100%': { backgroundPosition: '1000px 0' },
                        },
                        float: {
                                '0%, 100%': { transform: 'translateY(0px)' },
                                '50%': { transform: 'translateY(-10px)' },
                        },
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'fade-in': 'fadeIn 0.5s ease-in-out',
                        'slide-up': 'slideUp 0.5s ease-out',
                        'slide-down': 'slideDown 0.5s ease-out',
                        'scale-in': 'scaleIn 0.3s ease-out',
                        'shimmer': 'shimmer 2s infinite',
                        'float': 'float 3s ease-in-out infinite',
                },
                backgroundImage: {
                        'gradient-primary': 'linear-gradient(135deg, #0078e6 0%, #00ba68 100%)',
                        'gradient-soft': 'linear-gradient(135deg, #e6f0ff 0%, #e6f9f0 100%)',
                        'gradient-overlay': 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 100%)',
                        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
                },
        }
    },
    plugins: [require("tailwindcss-animate")],
  }
