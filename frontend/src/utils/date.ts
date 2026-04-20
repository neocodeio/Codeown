export const formatRelativeDate = (dateString: string | null | undefined) => {
    if (!dateString) return "some time ago";

    // If the string doesn't have timezone info, it's likely UTC from the DB
    // Append 'Z' to treat it as UTC instead of local time
    const normalizedString = dateString.includes('Z') || dateString.includes('+')
        ? dateString
        : dateString.replace(' ', 'T') + 'Z';

    let date = new Date(normalizedString);

    // Fallback for invalid dates
    if (isNaN(date.getTime())) {
        date = new Date(dateString);
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // If less than a minute
    if (diffInSeconds < 60) return "just now";

    // If less than an hour
    if (diffInSeconds < 3600) {
        const minutes = Math.max(1, Math.floor(diffInSeconds / 60));
        return `${minutes} ${minutes === 1 ? 'min' : 'min'} ago`;
    }

    // If less than 24 hours
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    // After 24 hours, show the date
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
};

export const formatJoinDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });
};

export const formatProfileJoinDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
};

export const formatCompactRelativeDate = (dateString: string) => {
    if (!dateString) return "";

    const normalizedString = dateString.includes('Z') || dateString.includes('+')
        ? dateString
        : dateString.replace(' ', 'T') + 'Z';

    let date = new Date(normalizedString);
    if (isNaN(date.getTime())) {
        date = new Date(dateString);
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} min`;
    }
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} h`;
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
};

export const formatFullTwitterDate = (dateString: string) => {
    if (!dateString) return "";

    const normalizedString = dateString.includes('Z') || dateString.includes('+')
        ? dateString
        : dateString.replace(' ', 'T') + 'Z';

    let date = new Date(normalizedString);
    if (isNaN(date.getTime())) {
        date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return "";

    const time = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });

    const fullDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return `${time} · ${fullDate}`;
};

export const formatMessageTimestamp = (dateString: string) => {
    if (!dateString) return "";

    const normalizedString = dateString.includes('Z') || dateString.includes('+')
        ? dateString
        : dateString.replace(' ', 'T') + 'Z';

    let date = new Date(normalizedString);
    if (isNaN(date.getTime())) {
        date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return "";

    const now = new Date();

    // Check if it's today
    const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) return "Today";

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInDays = Math.floor(diffInSeconds / 86400);

    if (diffInDays < 7) {
        return `${Math.max(1, diffInDays)}d`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 52) {
        return `${diffInWeeks}w`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y`;
};

