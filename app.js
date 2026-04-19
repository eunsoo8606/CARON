const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Layout Setup
app.use(expressLayouts);
app.set('layout', 'layout/base');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Static Files Setup
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to pass current path to all templates
app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: '신차장기렌트·리스 전문 - CARON'
    });
});

// Company Intro
app.get('/about', (req, res) => {
    res.render('about', { 
        title: '회사소개'
    });
});

// Lease Succession
app.get('/succession', (req, res) => {
    res.render('succession', { 
        title: '리스/렌트 승계',
        hideSidebar: true
    });
});

// Vehicle Search
app.get('/search', (req, res) => {
    res.render('sub_template', { 
        title: '차량검색'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
