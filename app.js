/* ==========================================================================
   Jerry Enterprises Custom JavaScript Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. Theme Toggle & Dark Mode Controller
       ========================================================================== */
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const htmlElement = document.documentElement;

    // Retrieve saved user preference or fall back to system dark-mode setting
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'light') {
        htmlElement.setAttribute('data-theme', 'light');
    } else if (savedTheme === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
    } else {
        // Fallback to system default
        htmlElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    }

    // Toggle click event
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });


    /* ==========================================================================
       2. Mobile Responsive Menu
       ========================================================================== */
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle menu visibility
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            
            // Set active class on clicked link
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });


    /* ==========================================================================
       3. Services Tab System
       ========================================================================== */
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPanelId = btn.getAttribute('aria-controls');
            
            // Toggle Active state on buttons
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            
            // Toggle Active state on panels
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
            });
            document.getElementById(targetPanelId).classList.add('active');
            
            // Dynamic logo icon transition matching the tab selected
            const sparkPath = document.querySelector('.spark-path');
            const plumbPath = document.querySelector('.plumb-path');
            if (targetPanelId === 'panel-plumbing') {
                sparkPath.style.display = 'none';
                plumbPath.style.display = 'block';
            } else {
                sparkPath.style.display = 'block';
                plumbPath.style.display = 'none';
            }
        });
    });


    /* ==========================================================================
       4. Interactive Cost Estimator & Quote Engine
       ========================================================================== */
    const sqftSlider = document.getElementById('sqftSlider');
    const areaValueDisplay = document.getElementById('areaValueDisplay');
    const checkElectrical = document.getElementById('checkElectrical');
    const checkPlumbing = document.getElementById('checkPlumbing');
    const costRangeText = document.getElementById('costRangeText');
    
    // Summary elements
    const sumFootprint = document.getElementById('sumFootprint');
    const sumServices = document.getElementById('sumServices');
    const sumTier = document.getElementById('sumTier');
    
    const whatsappQuoteBtn = document.getElementById('whatsappQuoteBtn');

    // Dynamic cost parameters (estimation guidelines)
    // base rate per sqft for electrical + plumbing in Chennai
    const rates = {
        baseSqftRate: 110, // base integrated electrical+plumbing rate per sqft
        serviceSplit: {
            electrical: 0.55, // electrical represents 55% of build cost
            plumbing: 0.45    // plumbing represents 45% of build cost
        },
        buildingMultiplier: {
            individual: 1.0,  // Individual House / Villa
            apartment: 0.9,   // Apartment Block (scale economics)
            commercial: 1.25  // Commercial complex (more industrial runs)
        },
        materialTierMultiplier: {
            standard: 0.85,    // economy utility
            premium: 1.15,     // Premium brand focus (Finolex, Ashirvad, etc.)
            ultra: 1.6        // Smart tech, heavy copper, noise-reduction pipes
        }
    };

    function calculateEstimate() {
        const sqft = parseInt(sqftSlider.value, 10);
        
        // 1. Get Building Type
        const buildingTypeEl = document.querySelector('input[name="buildingType"]:checked');
        const buildingType = buildingTypeEl ? buildingTypeEl.value : 'individual';
        const buildTypeLabel = buildingTypeEl ? buildingTypeEl.nextElementSibling.querySelector('.option-label').innerText : 'Individual Villa';
        
        // 2. Get Services Checked
        const electActive = checkElectrical.checked;
        const plumbActive = checkPlumbing.checked;
        
        // 3. Get Material Tier Chosen
        const materialTierEl = document.querySelector('input[name="materialTier"]:checked');
        const materialTier = materialTierEl ? materialTierEl.value : 'premium';
        const materialTierLabel = materialTierEl ? materialTierEl.nextElementSibling.querySelector('.tier-title').innerText : 'Premium Executive';

        // Update Footprint UI Text
        areaValueDisplay.innerText = `${sqft.toLocaleString('en-IN')} Sq.Ft.`;
        sumFootprint.innerText = `${sqft.toLocaleString('en-IN')} Sq.Ft.`;
        sumTier.innerText = materialTierLabel;

        // Service string formatting
        let serviceStr = '';
        if (electActive && plumbActive) {
            serviceStr = 'Electrical & Plumbing';
        } else if (electActive) {
            serviceStr = 'Electrical Only';
        } else if (plumbActive) {
            serviceStr = 'Plumbing Only';
        } else {
            serviceStr = 'No Service Selected';
        }
        sumServices.innerText = serviceStr;

        // If no services are selected, range is zero
        if (!electActive && !plumbActive) {
            costRangeText.innerText = '₹ 0';
            return { sqft, buildTypeLabel, serviceStr, materialTierLabel, lowerLimit: 0, upperLimit: 0 };
        }

        // Calculate Cost Core
        let baseCost = sqft * rates.baseSqftRate;
        
        // Apply service splitting
        let serviceFactor = 0;
        if (electActive) serviceFactor += rates.serviceSplit.electrical;
        if (plumbActive) serviceFactor += rates.serviceSplit.plumbing;
        
        // Apply multipliers
        const typeMult = rates.buildingMultiplier[buildingType] || 1.0;
        const tierMult = rates.materialTierMultiplier[materialTier] || 1.0;
        
        let calculatedBase = baseCost * serviceFactor * typeMult * tierMult;
        
        // Set lower and upper limit range (e.g. +/- 10% structural margin)
        let lowerLimit = Math.round((calculatedBase * 0.9) / 500) * 500;
        let upperLimit = Math.round((calculatedBase * 1.1) / 500) * 500;

        // Format to Indian Currency text representation
        const formattedLower = lowerLimit.toLocaleString('en-IN');
        const formattedUpper = upperLimit.toLocaleString('en-IN');
        
        costRangeText.innerText = `${formattedLower} - ${formattedUpper}`;
        
        return {
            sqft,
            buildTypeLabel,
            serviceStr,
            materialTierLabel,
            lowerLimit,
            upperLimit
        };
    }

    // Bind event listeners to form element inputs
    sqftSlider.addEventListener('input', calculateEstimate);
    document.querySelectorAll('input[name="buildingType"]').forEach(radio => {
        radio.addEventListener('change', calculateEstimate);
    });
    document.querySelectorAll('input[name="materialTier"]').forEach(radio => {
        radio.addEventListener('change', calculateEstimate);
    });
    checkElectrical.addEventListener('change', calculateEstimate);
    checkPlumbing.addEventListener('change', calculateEstimate);

    // Run initial execution
    calculateEstimate();


    /* ==========================================================================
       5. Dynamic WhatsApp Order Generator
       ========================================================================== */
    whatsappQuoteBtn.addEventListener('click', () => {
        const details = calculateEstimate();
        
        if (details.lowerLimit === 0) {
            alert('Please select at least one engineering service to generate a WhatsApp quote inquiry.');
            return;
        }

        // Construct highly professional message templates
        const whatsappNumber = '919176121232';
        const message = `Hello Jerry Enterprises,

I am planning a new building project in Chennai and would like to get a top-to-bottom structural service quote under R. Karthick's guidance.

Here are my project configuration specifications:
• Building Footprint: ${details.sqft.toLocaleString('en-IN')} Sq.Ft.
• Classification: ${details.buildTypeLabel}
• Selected Services: ${details.serviceStr}
• Material Standard: ${details.materialTierLabel}
• Estimated Range Guideline: INR ${details.lowerLimit.toLocaleString('en-IN')} to INR ${details.upperLimit.toLocaleString('en-IN')}

Please coordinate a free site blueprint check or engineering consultation.

Thank you!`;

        const encodedMsg = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMsg}`;
        
        // Direct browser focus redirect
        window.open(whatsappUrl, '_blank');
    });


    /* ==========================================================================
       6. Before/After Work Interactive Touch Slider
       ========================================================================== */
    const workSlider = document.getElementById('workSlider');
    const afterImageContainer = document.getElementById('afterImageContainer');
    const sliderHandle = document.getElementById('sliderHandle');

    if (workSlider && afterImageContainer && sliderHandle) {
        let isDragging = false;

        const startDragging = () => {
            isDragging = true;
        };

        const stopDragging = () => {
            isDragging = false;
        };

        const onMove = (clientX) => {
            if (!isDragging) return;

            const rect = workSlider.getBoundingClientRect();
            const offsetX = clientX - rect.left;
            let percentage = (offsetX / rect.width) * 100;

            // Constrain limits
            if (percentage < 0) percentage = 0;
            if (percentage > 100) percentage = 100;

            afterImageContainer.style.width = `${percentage}%`;
            sliderHandle.style.left = `${percentage}%`;
        };

        // Desktop Mouse Listeners
        sliderHandle.addEventListener('mousedown', startDragging);
        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('mousemove', (e) => onMove(e.clientX));

        // Mobile Touch Listeners
        sliderHandle.addEventListener('touchstart', startDragging);
        window.addEventListener('touchend', stopDragging);
        window.addEventListener('touchcancel', stopDragging);
        window.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches.length > 0) {
                onMove(e.touches[0].clientX);
            }
        });
    }


    /* ==========================================================================
       7. Scroll Animation Observer (Fade-In / Slides)
       ========================================================================== */
    const animateElements = document.querySelectorAll('.animate-on-scroll');

    const observerOptions = {
        root: null, // viewport
        threshold: 0.15, // trigger when 15% visible
        rootMargin: '0px 0px -50px 0px' // offset bottom slightly
    };

    const intersectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target); // Stop tracking once visible
            }
        });
    }, observerOptions);

    animateElements.forEach(el => {
        intersectionObserver.observe(el);
    });

});
