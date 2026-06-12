import React from 'react'

function Logo({ className }: { className?: string }) {
    return (
        <div className="">
            <img src="/mako-logo.png" alt="Mako" className={`h-24 w-auto ${className}`} />
        </div>
    )
}

export default Logo