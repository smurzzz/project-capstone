import { isMembershipActive } from '../../utils/membership';

export default function MemberBadge({ membership, size = 'md' }) {
    if (!membership || !isMembershipActive(membership)) {
        return null;
    }

    const label = membership.tier ? membership.tier.charAt(0).toUpperCase() : 'M';
    const sizeClasses = {
        sm: 'h-6 w-6 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-10 w-10 text-base',
        xl: 'h-12 w-12 text-lg'
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white select-none shadow-lg bg-green-600`}
            title={`${membership.tier || 'Member'} Member`}
        >
            {label}
        </div>
    );
}
