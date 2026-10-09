const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user (Auto assigns role 'normal' and membership score 10)
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, fullname, password } = req.body;

    if (!username || !fullname || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, fullname, and password are required',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `Username '${username}' is already taken`,
      });
    }

    // 1. Ensure Role 'normal' exists
    let role = await prisma.role.findFirst({
      where: { rolename: 'normal' },
    });
    if (!role) {
      role = await prisma.role.create({
        data: { rolename: 'normal' },
      });
    }

    // 2. Ensure MemberShip with score 10 exists
    let membership = await prisma.memberShip.findFirst({
      where: { mname: 'normal' },
    });
    if (!membership) {
      membership = await prisma.memberShip.create({
        data: { mname: 'normal', score: 10 },
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User
    const newUser = await prisma.user.create({
      data: {
        username,
        fullname,
        password: hashedPassword,
        roleid: role.roleid,
        mid: membership.mid,
      },
      include: {
        role: true,
        membership: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully with role normal and score 10',
      data: {
        uid: newUser.uid,
        username: newUser.username,
        fullname: newUser.fullname,
        role: newUser.role.rolename,
        score: newUser.membership.score,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Login and retrieve JWT token
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: true,
        membership: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const token = jwt.sign(
      {
        uid: user.uid,
        username: user.username,
        role: user.role.rolename,
      },
      process.env.JWT_SECRET || 'supersecretjwtkey_exam_iuh_2026',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        uid: user.uid,
        username: user.username,
        fullname: user.fullname,
        role: user.role.rolename,
        score: user.membership.score,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};
