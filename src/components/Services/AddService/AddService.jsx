import './AddService.css'

import { API_URL, Button, getToken, Input, Navbar, ResponsiveNav, storage } from '../../Utils'
import { SessionContext } from '../../../context/SessionContext'

import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer, Zoom } from 'react-toastify'
import jwtDecode from 'jwt-decode'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { ToastifyContext } from '../../../context/ToastifyContext'

const AddService = () => {
  // * Navigate
  const navigate = useNavigate()

  // ? Context
  const { session, tempSession } = useContext(SessionContext)
  const { setToastify } = useContext(ToastifyContext)

  // * States
  const [button, setButton] = useState(null)
  const [lastId, setLastId] = useState(null)
  const [disabled, setDisabled] = useState(false)

  // * Inputs
  const nombre_servicioInputEl = useRef(null)
  const descripcion_servicioInputEl = useRef(null)
  const resumen_servicioInputEl = useRef(null)
  const foto_servicioInputEl = useRef(null)
  const galeria_serviciosInputEl = useRef(null)

  // * Focus input
  const focusInput = (input) => input.current.focus()

  // * Toastify context false
  useEffect(() => {
    setToastify(false)
  }, [setToastify])

  // * Validación de inputs
  const validarInputs = async (e) => {
    e.preventDefault()

    const nombre_servicio = e.target[0].value
    const descripcion_servicio = e.target[1].value
    const resumen_servicio = e.target[2].value
    const foto_servicio = await uploadPhoto()
    const galeria_servicios = await uploadGallery()

    if (nombre_servicio.length === 0 || /^\s+$/.test(nombre_servicio)) {
      toast.error('¡El nombre del servicio no puede estar vacío!', {
        theme: 'colored'
      })
      focusInput(nombre_servicioInputEl)
      return false
    } else if (nombre_servicio.length < 3) {
      toast.error('¡El nombre del servicio debe tener mínimo 3 letras!', {
        theme: 'colored'
      })
      focusInput(nombre_servicioInputEl)
      return false
    } else if (descripcion_servicio.length === 0 || /^\s+$/.test(descripcion_servicio)) {
      toast.error('¡La descripción no puede estar vacía!', {
        theme: 'colored'
      })
      focusInput(descripcion_servicioInputEl)
      return false
    } else if (descripcion_servicio.length < 3) {
      toast.error('¡La descripción deben tener mínimo 3 letras!', {
        theme: 'colored'
      })
      focusInput(descripcion_servicioInputEl)
      return false
    } else if (resumen_servicio.length === 0) {
      toast.error('¡El resumen del servicio no puede estar vacío!', {
        theme: 'colored'
      })
      focusInput(resumen_servicioInputEl)
      return false
    } else if (resumen_servicio.length < 3) {
      toast.error('¡El resumen del servicio debe tener mínimo 3 letras!', {
        theme: 'colored'
      })
      focusInput(resumen_servicioInputEl)
      return false
    } else if (!foto_servicioInputEl.current.files[0] || foto_servicioInputEl.current.files[0].length === 0) {
      toast.error('¡Debes seleccionar una foto!', {
        theme: 'colored'
      })
      focusInput(foto_servicioInputEl)
      return false
    } else if (!galeria_serviciosInputEl.current.files || galeria_serviciosInputEl.current.files.length === 0) {
      toast.error('¡Debes seleccionar al menos una foto!', {
        theme: 'colored'
      })
      focusInput(galeria_serviciosInputEl)
      return false
    }
    return { nombre_servicio, descripcion_servicio, resumen_servicio, foto_servicio, galeria_servicios }
  }

  // * Renderizar botones de navbar
  useEffect(() => {
    !session ? setButton(1) : setButton(2)
    !tempSession ? setButton(1) : setButton(2)
  }, [])

  // * Cambiar título de la página
  const [title, setTitle] = useState('FADEMET Montajes | Crear Servicio')
  useEffect(() => {
    // ? Scroll to top
    window.scrollTo(0, 0)

    document.title = title
  }, [setTitle])

  // * Validate if user is admin
  useEffect(() => {
    const token = getToken()
    if (!token) return navigate('/login')
    const decode = jwtDecode(token)
    const { id_rol } = decode.data[0]
    if (id_rol === 2) return navigate('/')
  }, [])

  // * Upload photo to firebase and bd
  useEffect(() => {
    axios.get(API_URL('ultimoId'))
      .then(({ data }) => {
        setLastId(data.lastID[0].lastID)
      })
  })

  // * Upload Gallery to firebase
  const uploadGallery = async () => {
    const galeria_servicios = galeria_serviciosInputEl.current.files
    if (!galeria_servicios || !galeria_servicios.length) return false

    const urls = []
    for (let i = 0; i < galeria_servicios.length; i++) {
      const galeria_servicio = galeria_servicios[i]
      const imgRef = ref(storage, `servicesGaleria${lastId + 1}/${galeria_servicio.name + uuidv4()}`)
      await uploadBytes(imgRef, galeria_servicio)
      const url = await getDownloadURL(imgRef)
      urls.push(url)
    }
    const galeria_serviciosString = urls.join(', ')
    return galeria_serviciosString
  }

  // * Upload photo to firebase
  const uploadPhoto = async () => {
    try {
      const foto_servicio = foto_servicioInputEl.current.files[0]
      if (!foto_servicio) return false
      const imgRef = ref(storage, `servicesPhoto${lastId + 1}/${foto_servicio.name + uuidv4()}`)
      await uploadBytes(imgRef, foto_servicio)
      const url = await getDownloadURL(imgRef)
      return url
    } catch (error) {
      throw new Error(error)
    }
  }

  const submitService = async (e) => {
    e.preventDefault()
    setDisabled(true)
    const body = await validarInputs(e)
    if (body.length === 0) return false
    postForm(body)
  }

  const postForm = (body) => {
    axios.post(API_URL('servicios'), body)
      .then(() => {
        navigate('/services')
        setToastify('serviceCreated')
      })
      .catch(() => {
        toast.error('¡Ha ocurrido un error al crear el servicio!', {
          theme: 'colored'
        })
        setDisabled(false)
      })
  }

  return (
    <>
      <ResponsiveNav
        linkText={['Inicio', 'Servicios']}
        linkUrl={['/', '/services']}
        renderButtons={button}
      />
      <Navbar
        linkText={['Inicio', 'Servicios']}
        linkUrl={['/', '/services']}
        renderButtons={button}
      />
      <div className='service-div'>
        <ToastContainer transition={Zoom} limit={3} pauseOnFocusLoss={false} />
        <section className='add-service-form'>
          <div className='info-create'>
            <p>Llena este formulario para crear un nuevo servicio</p>
            <div className='buttons'>
            </div>
          </div>
          <form className='service-form' onSubmit={submitService}>
            <div className='main-form'>
              <Input
                text='Nombre del servicio'
                innerId='nombre-servicio'
                type='text'
                nameID='nombre_servicio'
                max={100}
                innerRef={nombre_servicioInputEl}
              />
              <Input
                text='Descripción del servicio'
                innerId='descripcion-servicio'
                type='text'
                max={600}
                nameID='descripcion_servicio'
                innerRef={descripcion_servicioInputEl}
              />
              <Input
                text='Resumen del servicio'
                innerId='resumen-servicio'
                type='text'
                max={100}
                nameID='resumen_servicio'
                innerRef={resumen_servicioInputEl}
              />
              <Input
                text='Foto del servicio'
                innerId='foto-servicio'
                type='file'
                nameID='foto_servicio'
                innerRef={foto_servicioInputEl}
              />
              <Input
                text='Galería de los servicios'
                innerId='galeria-servicio'
                type='file'
                nameID='galeria_servicios'
                innerRef={galeria_serviciosInputEl}
                multiple='multiple'
              />
            </div>
            <div className="send">
              <Button text={'Crear'} width={150} disable={disabled} textDisabled={'Cargando'}/>
            </div>
          </form>
        </section>
      </div>
    </>
  )
}

export { AddService }