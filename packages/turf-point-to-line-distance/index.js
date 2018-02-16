// Taken from http://geomalgorithms.com/a02-_lines.html
import { featureOf } from '@turf/invariant';
import { segmentEach } from '@turf/meta';
import getDistance from '@turf/distance';
import getPlanarDistance from '@turf/rhumb-distance';
import {
    point,
    feature,
    lineString,
    convertLength,
    isObject
} from '@turf/helpers';

/**
 * Returns the minimum distance between a {@link Point} and a {@link LineString}, being the distance from a line the
 * minimum distance between the point and any segment of the `LineString`.
 *
 * @name pointToLineDistance
 * @param {Coord} pt Feature or Geometry
 * @param {Feature<LineString>} line GeoJSON Feature or Geometry
 * @param {Object} [options={}] Optional parameters
 * @param {string} [options.units='kilometers'] can be anything supported by turf/convertLength, eg degrees, radians, miles, or kilometers
 * @param {string} [options.method='geodesic'] wehther to calculate the distance based on geodesic (spheroid) or planar (flat) method. Valid options are 'geodesic' or 'planar'.
 * @returns {number} distance between point and line
 * @example
 * var pt = turf.point([0, 0]);
 * var line = turf.lineString([[1, 1],[-1, 1]]);
 *
 * var distance = turf.pointToLineDistance(pt, line, {units: 'miles'});
 * //=69.11854715938406
 */
function pointToLineDistance(pt, line, options) {
    // Optional parameters
    options = options || {};
    if (!isObject(options)) throw new Error('options is invalid');

    if (!options.method) options.method = 'geodesic';
    if (!options.unit) options.unit = 'kilometers';

    // validation
    if (!pt) throw new Error('pt is required');
    if (Array.isArray(pt)) pt = point(pt);
    else if (pt.type === 'Point') pt = feature(pt);
    else featureOf(pt, 'Point', 'point');

    if (!line) throw new Error('line is required');
    if (Array.isArray(line)) line = lineString(line);
    else if (line.type === 'LineString') line = feature(line);
    else featureOf(line, 'LineString', 'line');

    var distance = Infinity;
    var p = pt.geometry.coordinates;
    segmentEach(line, function (segment) {
        var a = segment.geometry.coordinates[0];
        var b = segment.geometry.coordinates[1];
        var d = distanceToSegment(p, a, b, options);
        if (d < distance) distance = d;
    });
    return convertLength(distance, 'degrees', options.units);
}


/**
 * Returns the distance between a point P on a segment AB.
 *
 * @private
 * @param {Array<number>} p external point
 * @param {Array<number>} a first segment point
 * @param {Array<number>} b second segment point
  * @param {Object} [options={}] Optional parameters
 * @returns {number} distance
 */
function distanceToSegment(p, a, b, options) {
    var v = [b[0] - a[0],  b[1] - a[1]];
    var w = [p[0] - a[0],  p[1] - a[1]];

    var c1 = dot(w, v);
    if (c1 <= 0) return calcDistance(p, a, {method: options.method, units: 'degrees'});
    var c2 = dot(v, v);
    if (c2 <= c1) return calcDistance(p, b, {method: options.method, units: 'degrees'});
    var b2 = c1 / c2;
    var Pb = [a[0] + (b2 * v[0]), a[1] + (b2 * v[1])];
    return calcDistance(p, Pb, {method: options.method, units: 'degrees'});
}

function dot(u, v) {
    return (u[0] * v[0] + u[1] * v[1]);
}

function calcDistance(a, b, options) {
    return options.method === 'planar' ? getPlanarDistance(a, b, options) : getDistance(a, b, options);
}

export default pointToLineDistance;
