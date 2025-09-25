/*
   File Description: Common JS file of the template(plugins.init.js)
*/


/***********************************/
/*         INDEX                   */
/*==================================
 *     01.  Tobii lightbox         * (For Portfolio pages)
 *     02.  Data Counter           *
 *     03.  Typed Text animation   *
 *     04.  Back Button            *
 ==================================*/

//=========================================//
/*/*            01) Tobii lightbox         */
//=========================================//
/* 
try {
    const tobii = new Tobii()
} catch (err) {

}
 */
//=========================================//
/*/*            03) Data Counter           */
//=========================================//
/*
try {
    const counter = document.querySelectorAll('.counter-value');
    const speed = 2500; // The lower the slower

    counter.forEach(counter_value => {
        const updateCount = () => {
            const target = +counter_value.getAttribute('data-target');
            const count = +counter_value.innerText;

            // Lower inc to slow and higher to slow
            var inc = target / speed;

            if (inc < 1) {
                inc = 1;
            }

            // Check if target is reached
            if (count < target) {
                // Add inc to count and output in counter_value
                counter_value.innerText = (count + inc).toFixed(0);
                // Call function every ms
                setTimeout(updateCount, 1);
            } else {
                counter_value.innerText = target;
            }
        };

        updateCount();
    });
} catch (err) {

}
 */

//=========================================//
/*/* 03) Typed Text animation (animation) */
//=========================================//
try {
    var TxtType = function(el, toRotate, period) {
        this.toRotate = toRotate;
        this.el = el;
        this.loopNum = 0;
        this.period = parseInt(period, 10) || 2000;
        this.txt = '';
        this.tick();
        this.isDeleting = false;
    };

    TxtType.prototype.tick = function() {
        var i = this.loopNum % this.toRotate.length;
        var fullTxt = this.toRotate[i];
        var textElement = document.querySelector('.dynamic-text');

        if (this.isDeleting) {
            this.txt = fullTxt.substring(0, this.txt.length - 1);
        } else {
            this.txt = fullTxt.substring(0, this.txt.length + 1);
        }

        this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';

        // Actualiza el texto dinámico mientras escribe
        if (!this.isDeleting) {
            updateDynamicText(fullTxt, textElement);
        }

        // Controla el inicio y el final del ciclo
        var that = this;
        var delta = 300 - Math.random() * 100;
        if (this.isDeleting) {
            delta /= 2;
        }
        if (!this.isDeleting && this.txt === fullTxt) {
            this.isDeleting = true;
            delta = this.period;
        } else if (this.isDeleting && this.txt === '') {
            this.isDeleting = false;
            this.loopNum++;
            delta = 500;
        }
        setTimeout(function() {
            that.tick();
        }, delta);
    };

    function updateDynamicText(currentWord, element) {
        // Cambia el texto dinámico según la palabra actual
        if (currentWord === "Cyberseguridad") {
            element.textContent = "Protege tu empresa con soluciones avanzadas de ciberseguridad. Desde cumplimiento normativo y análisis de vulnerabilidades hasta ethical hacking y simulaciones de ataques, fortalecemos tu seguridad digital para minimizar riesgos y garantizar la continuidad de tu negocio.";
        } else if (currentWord === "Marketing Digital") {
            element.textContent = "Impulsa tu marca con estrategias de marketing digital que potencian tu identidad, aumentan tu visibilidad y conectan con tu audiencia. Desde posicionamiento de marca hasta campañas publicitarias, llevamos tu negocio al siguiente nivel.";
        } else if (currentWord === "Servicio de Desarrollo") {
            element.textContent = "Construimos soluciones de software a medida, ágiles y escalables para impulsar tu negocio. Desde aplicaciones móviles hasta modernización de sistemas, combinamos tecnología de vanguardia con un enfoque estratégico para optimizar procesos y mejorar la experiencia digital.";
        }
    }

    function typewrite() {
        var elements = document.getElementsByClassName('typewrite');
        for (var i = 0; i < elements.length; i++) {
            var toRotate = elements[i].getAttribute('data-type');
            var period = elements[i].getAttribute('data-period');
            if (toRotate) {
                new TxtType(elements[i], JSON.parse(toRotate), period);
            }
        }
        // INJECT CSS
        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = ".typewrite > .wrap { border-right: 0.08em solid transparent }";
        document.body.appendChild(css);
    }

    window.onload = typewrite;
} catch (err) {
    console.error("Error en la animación de texto:", err);
}
//=========================================//
/*/*            04) Back Button            */
//=========================================//
document.getElementsByClassName("back-button")[0]?.addEventListener("click", (e) => {
    if (document.referrer !== "") {
        e.preventDefault();
        window.location.href = document.referrer;
    }
})


if (document.getElementsByClassName('tiny-two-item').length > 0) {
    var slider = tns({
        container: '.tiny-two-item',
        controls: true,
        mouseDrag: true,
        loop: true,
        rewind: true,
        autoplay: true,
        autoplayButtonOutput: false,
        autoplayTimeout: 3000,
        navPosition: "bottom",
        controlsText: ['<i class="mdi mdi-chevron-left "></i>', '<i class="mdi mdi-chevron-right"></i>'],
        nav: false,
        speed: 400,
        gutter: 0,
        responsive: {
            768: {
                items: 2
            },
        },
    });
};

//=========================================//
/*/*            05) Contact Form           */
//=========================================//



//=========================================//
/*/*            Audio       */
//=========================================//