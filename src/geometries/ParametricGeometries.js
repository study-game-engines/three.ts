import { BufferGeometry, Curve, ParametricGeometry, Vector3 } from 'three'

/**
 * Experimenting of primitive geometry creation using Surface Parametric equations
 */

const ParametricGeometries = {
  klein: function (v, u, target) {
    u *= Math.PI
    v *= 2 * Math.PI

    u = u * 2
    let x, y, z
    if (u < Math.PI) {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u) / 2) * Math.cos(u) * Math.cos(v)
      z = -8 * Math.sin(u) - 2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v)
    } else {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u) / 2) * Math.cos(v + Math.PI)
      z = -8 * Math.sin(u)
    }

    y = -2 * (1 - Math.cos(u) / 2) * Math.sin(v)

    target.set(x, y, z)
  },

  plane: function (width, height) {
    return (u, v, target) => {
      const x = u * width
      const y = 0
      const z = v * height

      target.set(x, y, z)
    }
  },

  mobius: function (u, t, target) {
    // flat mobius strip
    // http://www.wolframalpha.com/input/?i=M%C3%B6bius+strip+parametric+equations&lk=1&a=ClashPrefs_*Surface.MoebiusStrip.SurfaceProperty.ParametricEquations-
    u = u - 0.5
    const v = 2 * Math.PI * t

    let x, y, z

    const a = 2

    x = Math.cos(v) * (a + u * Math.cos(v / 2))
    y = Math.sin(v) * (a + u * Math.cos(v / 2))
    z = u * Math.sin(v / 2)

    target.set(x, y, z)
  },

  mobius3d: function (u, t, target) {
    // volumetric mobius strip

    u *= Math.PI
    t *= 2 * Math.PI

    u = u * 2
    const phi = u / 2
    const major = 2.25,
      a = 0.125,
      b = 0.65

    let x, y, z

    x = a * Math.cos(t) * Math.cos(phi) - b * Math.sin(t) * Math.sin(phi)
    z = a * Math.cos(t) * Math.sin(phi) + b * Math.sin(t) * Math.cos(phi)
    y = (major + x) * Math.sin(u)
    x = (major + x) * Math.cos(u)

    target.set(x, y, z)
  },
}

/*********************************************
 *
 * Parametric Replacement for TubeGeometry
 *
 *********************************************/

ParametricGeometries.TubeGeometry = function (path, segments, radius, segmentsRadius, closed) {
  this.path = path
  this.segments = segments || 64
  this.radius = radius || 1
  this.segmentsRadius = segmentsRadius || 8
  this.closed = closed || false

  const scope = this,
    numpoints = this.segments + 1

  const frames = path.computeFrenetFrames(segments, closed),
    tangents = frames.tangents,
    normals = frames.normals,
    binormals = frames.binormals

  // proxy internals

  this.tangents = tangents
  this.normals = normals
  this.binormals = binormals

  const position = new Vector3()

  const ParametricTube = (u, v, target) => {
    v *= 2 * Math.PI

    let i = u * (numpoints - 1)
    i = Math.floor(i)

    path.getPointAt(u, position)

    const normal = normals[i]
    const binormal = binormals[i]

    const cx = -scope.radius * Math.cos(v) // TODO: Hack: Negating it so it faces outside.
    const cy = scope.radius * Math.sin(v)

    position.x += cx * normal.x + cy * binormal.x
    position.y += cx * normal.y + cy * binormal.y
    position.z += cx * normal.z + cy * binormal.z

    target.copy(position)
  }

  ParametricGeometry.call(this, ParametricTube, segments, segmentsRadius)
}

ParametricGeometries.TubeGeometry.prototype = Object.create(BufferGeometry.prototype)
ParametricGeometries.TubeGeometry.prototype.constructor = ParametricGeometries.TubeGeometry

/*********************************************
 *
 * Parametric Replacement for TorusKnotGeometry
 *
 *********************************************/
ParametricGeometries.TorusKnotGeometry = function (radius, tube, segmentsT, segmentsR, p, q) {
  this.radius = radius || 200
  this.tube = tube || 40
  this.segmentsT = segmentsT || 64
  this.segmentsR = segmentsR || 8
  this.p = p || 2
  this.q = q || 3

  class TorusKnotCurve extends Curve {
    constructor() {
      super()
    }

    getPoint(t, optionalTarget) {
      const point = optionalTarget || new Vector3()

      t *= Math.PI * 2

      const r = 0.5

      const x = (1 + r * Math.cos(q * t)) * Math.cos(p * t)
      const y = (1 + r * Math.cos(q * t)) * Math.sin(p * t)
      const z = r * Math.sin(q * t)

      return point.set(x, y, z).multiplyScalar(radius)
    }
  }

  const segments = segmentsT
  const radiusSegments = segmentsR
  const extrudePath = new TorusKnotCurve()

  ParametricGeometries.TubeGeometry.call(this, extrudePath, segments, tube, radiusSegments, true, false)
}

ParametricGeometries.TorusKnotGeometry.prototype = Object.create(BufferGeometry.prototype)
ParametricGeometries.TorusKnotGeometry.prototype.constructor = ParametricGeometries.TorusKnotGeometry

/*********************************************
 *
 * Parametric Replacement for SphereGeometry
 *
 *********************************************/
ParametricGeometries.SphereGeometry = function (size, u, v) {
  function sphere(u, v, target) {
    u *= Math.PI
    v *= 2 * Math.PI

    const x = size * Math.sin(u) * Math.cos(v)
    const y = size * Math.sin(u) * Math.sin(v)
    const z = size * Math.cos(u)

    target.set(x, y, z)
  }

  ParametricGeometry.call(this, sphere, u, v)
}

ParametricGeometries.SphereGeometry.prototype = Object.create(BufferGeometry.prototype)
ParametricGeometries.SphereGeometry.prototype.constructor = ParametricGeometries.SphereGeometry

/*********************************************
 *
 * Parametric Replacement for PlaneGeometry
 *
 *********************************************/

ParametricGeometries.PlaneGeometry = function (width, depth, segmentsWidth, segmentsDepth) {
  function plane(u, v, target) {
    const x = u * width
    const y = 0
    const z = v * depth

    target.set(x, y, z)
  }

  ParametricGeometry.call(this, plane, segmentsWidth, segmentsDepth)
}

ParametricGeometries.PlaneGeometry.prototype = Object.create(BufferGeometry.prototype)
ParametricGeometries.PlaneGeometry.prototype.constructor = ParametricGeometries.PlaneGeometry

export { ParametricGeometries }