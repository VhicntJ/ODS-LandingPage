/*
   File Description: Main JS file of the template
*/


/*********************************/
/*         INDEX                 */
/*================================
 *     01.  Preloader            *
 *     02.  Menus                *
 *     03.  Back to top          *
 *     04.  Dark & Light Mode    *
 *     05.  LTR & RTL Mode       *
 ================================*/
window.addEventListener('load', fn, false)

//  window.onload = function loader() {
function fn() {
    // Preloader
    if (document.getElementById('preloader')) {
        setTimeout(() => {
            document.getElementById('preloader').style.visibility = 'hidden';
            document.getElementById('preloader').style.opacity = '0';
        }, 350);
    }
}
/*********************/
/*     Menus         */
/*********************/

function windowScroll() {
    const navbar = document.getElementById("navbar");
    if (
        document.body.scrollTop >= 50 ||
        document.documentElement.scrollTop >= 50
    ) {
        navbar.classList.add("is-sticky");
    } else {
        navbar.classList.remove("is-sticky");
    }
}

window.addEventListener('scroll', (ev) => {
    ev.preventDefault();
    windowScroll();
})

// Navbar Active Class
try {
    var spy = new Gumshoe('#navbar-navlist a', {
        // Active classes
        // navClass: 'active', // applied to the nav list item
        // contentClass: 'active', // applied to the content
        offset: 80
    });
} catch (error) {

}


// Smooth scroll 
try {
    var scroll = new SmoothScroll('#navbar-navlist a', {
        speed: 800,
        offset: 80
    });
} catch (error) {

}

// Menu Collapse
const toggleCollapse = (elementId, show = true) => {
    const collapseEl = document.getElementById(elementId);
    if (show) {
        collapseEl.classList.remove('hidden');
    } else {
        collapseEl.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Toggle target elements using [data-collapse]
    document.querySelectorAll('[data-collapse]').forEach(function(collapseToggleEl) {
        var collapseId = collapseToggleEl.getAttribute('data-collapse');

        collapseToggleEl.addEventListener('click', function() {
            toggleCollapse(collapseId, document.getElementById(collapseId).classList.contains('hidden'));
        });
    });
});

window.toggleCollapse = toggleCollapse;

/*********************/
/*   Back To Top     */
/*********************/

window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    var mybutton = document.getElementById("back-to-top");
    if (mybutton != null) {
        if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
            mybutton.classList.add("block");
            mybutton.classList.remove("hidden");
        } else {
            mybutton.classList.add("hidden");
            mybutton.classList.remove("block");
        }
    }
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

/*********************/
/* Dark & Light Mode */
/*********************/
try {
    function changeTheme(e) {
        e.preventDefault()
        const htmlTag = document.getElementsByTagName("html")[0]

        if (htmlTag.className.includes("dark")) {
            htmlTag.className = 'light'
        } else {
            htmlTag.className = 'dark'
        }
    }

    const switcher = document.getElementById("theme-mode")
    switcher?.addEventListener("click", changeTheme)

    const chk = document.getElementById('chk')

    chk.addEventListener('change', changeTheme);
} catch (err) {

}


/*********************/
/* LTR & RTL Mode */
/*********************/
try {
    const htmlTag = document.getElementsByTagName("html")[0]

    function changeLayout(e) {
        e.preventDefault()
        const switcherRtl = document.getElementById("switchRtl")
        if (switcherRtl.innerText === "LTR") {
            htmlTag.dir = "ltr"
        } else {
            htmlTag.dir = "rtl"
        }

    }
    const switcherRtl = document.getElementById("switchRtl")
    switcherRtl?.addEventListener("click", changeLayout)
} catch (err) {}


/*******************/
/* Whatsapp Button */
/*******************/
$(function () {
    $('#my-whatsapp').floatingWhatsApp({
      phone: '56971769875', // Número de WhatsApp
      popupMessage: '¡Hola! Te gustaria tener mas informacion sobre el polo ODS 0 ? contáctanos',
      showPopup: true,
      position: 'right',
      autoOpenTimeout: 20000,
      
    });
  });
  
  

 /*******************/
/* Seguridad Redireccionamiento */
/*******************/

// Función para manejar la seguridad y redirección
function handleSecurity() {
    // Redirige a la página principal si la URL es index.html y no contiene un hash
    if (window.location.pathname === '/index.html' && !window.location.hash) {
        window.location.href = '/';
    }

    // Función para validar la URL
    function validateURL(url) {
        // Verificar si la URL contiene comillas simples
        if (url.indexOf("'") !== -1) {
            window.location.href = '/404.html'; // Redirigir a página de error
            return false;
        }
        return true;
    }

    // Verificar la URL actual y los parámetros
    validateURL(window.location.href);

    // Verificar todos los parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => {
        if (value.indexOf("'") !== -1) {
            window.location.href = '/404.html';
        }
    });
}

// Ejecutar la función de seguridad cuando se carga la página
document.addEventListener('DOMContentLoaded', handleSecurity);


/*******************/
/* Validar formulario */
/*******************/
function validateForm() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const comments = document.getElementById("comments").value.trim();

    // Obtener los servicios seleccionados
    const services = document.querySelectorAll("input[name='services[]']:checked");

    const errorMsg = document.getElementById("error-msg");
    errorMsg.innerText = ""; // Limpia el mensaje de error previo

    if (!name || !email || !telefono || !subject || !comments) {
        errorMsg.innerText = "*Por favor completa todos los campos*";
        return false;
    }

    // Validar correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorMsg.innerText = "*Por favor ingresa un correo válido*";
        return false;
    }

    // Validar teléfono (sólo números y longitud mínima de 7 dígitos)
    const telefonoRegex = /^\d{7,}$/;
    if (!telefonoRegex.test(telefono)) {
        errorMsg.innerText = "*Por favor ingresa un teléfono válido (solo números y al menos 7 dígitos)*";
        return false;
    }

    // Validar que al menos un servicio esté seleccionado
    if (services.length === 0) {
        errorMsg.innerText = "*Por favor selecciona al menos un servicio*";
        return false;
    }

    // Validación exitosa
    return true;
}

// Bloquear la entrada de palabras en el campo de teléfono (solo números)
document.getElementById("telefono").addEventListener("input", function (event) {
    this.value = this.value.replace(/[^0-9]/g, ''); // Remueve cualquier carácter que no sea un número
});
/*******************/
/* Toastr */ 
/*******************/
// Función para mostrar el loader
function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
    document.querySelector('.bloom-container').classList.add('bloom');
}

// Función para ocultar el loader
function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
    document.querySelector('.bloom-container').classList.remove('bloom');
}

// Función para manejar el envío del formulario
function handleSubmit(event) {
    event.preventDefault();  // Previene el envío del formulario

    // Muestra el loader
    showLoader();

    // Recoge los datos del formulario
    var formData = new FormData(document.getElementById('myForm'));

    // Realiza la petición AJAX al PHP
    $.ajax({
        url: 'assets/php/contact.php',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            hideLoader(); // Oculta el loader
            if (response.status === 'success') {
                toastr.success(response.message, 'Éxito');
                document.getElementById('myForm').reset(); // Limpia el formulario
            } else if (response.status === 'warning') {
                toastr.warning(response.message, 'Advertencia');
            } else if (response.status === 'danger') {
                toastr.error(response.message, 'Error');
            } else {
                toastr.error('Respuesta inesperada del servidor.', 'Error');
            }
        },
        error: function() {
            hideLoader(); // Oculta el loader
            toastr.error('Hubo un problema al enviar el mensaje. Intente de nuevo más tarde.', 'Error');
        }
    });
}

// Asigna la función handleSubmit al evento submit del formulario
document.getElementById('myForm').addEventListener('submit', handleSubmit);

// Configuración de Toastr
toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": true,
    "progressBar": true,
    "positionClass": "toast-top-center",
    "preventDuplicates": true,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

// Tiny Slider Initialization
try {
    var slider = function () {
        // Configuración común para primer slider
        const sliderConfig = {
            items: 3,
            controls: true,
            mouseDrag: true,
            loop: true,
            rewind: false,
            autoplay: true,
            autoplayButtonOutput: false,
            autoplayTimeout: 3000,
            autoplayHoverPause: false,
            navPosition: "bottom",
            controlsText: ['<i class="mdi mdi-chevron-left"></i>', '<i class="mdi mdi-chevron-right"></i>'],
            nav: false,
            speed: 800,
            gutter: 12,
            responsive: {
                992: {
                    items: 3
                },
                767: {
                    items: 2
                },
                320: {
                    items: 1
                },
            }
        };

        // Primer slider
        if (document.getElementsByClassName('tiny-three-item').length > 0) {
            var slider1 = tns({
                container: '.tiny-three-item',
                ...sliderConfig
            });
        }

        // Segundo slider (2 items)
        if (document.getElementsByClassName('tiny-two-item-2').length > 0) {
            var slider = tns({
                container: '.tiny-two-item-2',
                items: 1,
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
                gutter: 12,
                responsive: {
                    992: {
                        items: 2
                    },
                    767: {
                        items: 2
                    },
                    320: {
                        items: 1
                    },
                }
            });
        }
    };
    slider();
} catch (error) {
    console.log('Error initializing tiny-slider:', error);
}
