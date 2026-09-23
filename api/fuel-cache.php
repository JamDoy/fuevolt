<?php
// Shared file-based cache for the fuel-price proxy endpoints (qld-fuel.php,
// wa-fuel.php, nsw-fuel.php, vic-fuel.php, nt-fuel.php). One cached response
// per cache key is served to every visitor until it expires, instead of each
// visitor's own browser hitting the government API directly — cuts call
// volume from "per visitor" down to "per cache key per TTL window".
//
// Kept as plain functions (no class) to match this project's existing PHP
// style (see tomtom-cache.php, nt-fuel.php) rather than introducing a new
// pattern for one file.

const FUEL_CACHE_TTL = 3600; // 1 hour

function fuelCacheDir($name) {
    $dir = __DIR__ . '/cache/' . $name;
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return $dir;
}

// Returns the cached body if it's still fresh, otherwise null.
function fuelCacheGet($dir, $key, $ttlSeconds = FUEL_CACHE_TTL) {
    $file = $dir . '/' . $key . '.json';
    if (file_exists($file) && (time() - filemtime($file)) < $ttlSeconds) {
        return file_get_contents($file);
    }
    return null;
}

function fuelCacheSet($dir, $key, $data) {
    @file_put_contents($dir . '/' . $key . '.json', $data);
}

// A cached response of any age, even expired — used as a last-resort
// fallback when the upstream government API fails, so a temporary outage
// there doesn't take FueVolt's results down with it.
function fuelCacheStale($dir, $key) {
    $file = $dir . '/' . $key . '.json';
    return file_exists($file) ? file_get_contents($file) : null;
}
