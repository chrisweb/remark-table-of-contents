import './global.css'

export const metadata = {
    title: 'next.js example with app dir and mdx',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
