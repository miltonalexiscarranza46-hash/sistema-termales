--
-- PostgreSQL database dump
--

\restrict 80PcubBUkRMyfLiqJBDLNnFfEYfaiX3PIBcPGrhriagmXJWDgAgv85vhoJkgBG7

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-10-09 09:28:51

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16828)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5299 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 231 (class 1259 OID 16506)
-- Name: accesos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accesos (
    id integer NOT NULL,
    tipo_acceso_id integer NOT NULL,
    cantidad integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    usuario_id integer NOT NULL,
    fecha_hora timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT accesos_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.accesos OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16505)
-- Name: accesos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accesos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accesos_id_seq OWNER TO postgres;

--
-- TOC entry 5300 (class 0 OID 0)
-- Dependencies: 230
-- Name: accesos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accesos_id_seq OWNED BY public.accesos.id;


--
-- TOC entry 223 (class 1259 OID 16448)
-- Name: areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.areas (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE public.areas OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16447)
-- Name: areas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.areas_id_seq OWNER TO postgres;

--
-- TOC entry 5301 (class 0 OID 0)
-- Dependencies: 222
-- Name: areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.areas_id_seq OWNED BY public.areas.id;


--
-- TOC entry 233 (class 1259 OID 16531)
-- Name: cabanas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cabanas (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    capacidad integer NOT NULL,
    precio_noche numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'disponible'::character varying NOT NULL,
    CONSTRAINT cabanas_capacidad_check CHECK ((capacidad > 0)),
    CONSTRAINT cabanas_precio_noche_check CHECK ((precio_noche >= (0)::numeric))
);


ALTER TABLE public.cabanas OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16530)
-- Name: cabanas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cabanas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cabanas_id_seq OWNER TO postgres;

--
-- TOC entry 5302 (class 0 OID 0)
-- Dependencies: 232
-- Name: cabanas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cabanas_id_seq OWNED BY public.cabanas.id;


--
-- TOC entry 251 (class 1259 OID 16743)
-- Name: caja_diaria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.caja_diaria (
    id integer NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    monto_apertura numeric(10,2) DEFAULT 0 NOT NULL,
    monto_cierre numeric(10,2),
    estado character varying(10) DEFAULT 'abierta'::character varying NOT NULL,
    usuario_id integer NOT NULL,
    abierta_en timestamp without time zone DEFAULT now() NOT NULL,
    cerrada_en timestamp without time zone,
    CONSTRAINT caja_diaria_estado_check CHECK (((estado)::text = ANY ((ARRAY['abierta'::character varying, 'cerrada'::character varying])::text[])))
);


ALTER TABLE public.caja_diaria OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 16742)
-- Name: caja_diaria_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.caja_diaria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.caja_diaria_id_seq OWNER TO postgres;

--
-- TOC entry 5303 (class 0 OID 0)
-- Dependencies: 250
-- Name: caja_diaria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.caja_diaria_id_seq OWNED BY public.caja_diaria.id;


--
-- TOC entry 247 (class 1259 OID 16701)
-- Name: categorias_gasto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias_gasto (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE public.categorias_gasto OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 16700)
-- Name: categorias_gasto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_gasto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_gasto_id_seq OWNER TO postgres;

--
-- TOC entry 5304 (class 0 OID 0)
-- Dependencies: 246
-- Name: categorias_gasto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_gasto_id_seq OWNED BY public.categorias_gasto.id;


--
-- TOC entry 237 (class 1259 OID 16584)
-- Name: categorias_producto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias_producto (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE public.categorias_producto OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16583)
-- Name: categorias_producto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_producto_id_seq OWNER TO postgres;

--
-- TOC entry 5305 (class 0 OID 0)
-- Dependencies: 236
-- Name: categorias_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_producto_id_seq OWNED BY public.categorias_producto.id;


--
-- TOC entry 227 (class 1259 OID 16482)
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    telefono character varying(20),
    documento character varying(20),
    creado_en timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16481)
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_seq OWNER TO postgres;

--
-- TOC entry 5306 (class 0 OID 0)
-- Dependencies: 226
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- TOC entry 245 (class 1259 OID 16677)
-- Name: detalle_pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_pedido (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    CONSTRAINT detalle_pedido_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.detalle_pedido OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 16676)
-- Name: detalle_pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_pedido_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_pedido_id_seq OWNER TO postgres;

--
-- TOC entry 5307 (class 0 OID 0)
-- Dependencies: 244
-- Name: detalle_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_pedido_id_seq OWNED BY public.detalle_pedido.id;


--
-- TOC entry 249 (class 1259 OID 16712)
-- Name: gastos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gastos (
    id integer NOT NULL,
    categoria_id integer NOT NULL,
    area_id integer,
    monto numeric(10,2) NOT NULL,
    descripcion character varying(200),
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    usuario_id integer NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT gastos_monto_check CHECK ((monto > (0)::numeric))
);


ALTER TABLE public.gastos OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 16711)
-- Name: gastos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gastos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gastos_id_seq OWNER TO postgres;

--
-- TOC entry 5308 (class 0 OID 0)
-- Dependencies: 248
-- Name: gastos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gastos_id_seq OWNED BY public.gastos.id;


--
-- TOC entry 253 (class 1259 OID 16766)
-- Name: movimientos_caja; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientos_caja (
    id integer NOT NULL,
    caja_id integer NOT NULL,
    tipo character varying(10) NOT NULL,
    area_id integer,
    concepto character varying(150) NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha_hora timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT movimientos_caja_monto_check CHECK ((monto > (0)::numeric)),
    CONSTRAINT movimientos_caja_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ingreso'::character varying, 'egreso'::character varying])::text[])))
);


ALTER TABLE public.movimientos_caja OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 16765)
-- Name: movimientos_caja_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movimientos_caja_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimientos_caja_id_seq OWNER TO postgres;

--
-- TOC entry 5309 (class 0 OID 0)
-- Dependencies: 252
-- Name: movimientos_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimientos_caja_id_seq OWNED BY public.movimientos_caja.id;


--
-- TOC entry 241 (class 1259 OID 16625)
-- Name: movimientos_inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientos_inventario (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    tipo character varying(10) NOT NULL,
    cantidad integer NOT NULL,
    motivo character varying(100),
    usuario_id integer NOT NULL,
    fecha_hora timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT movimientos_inventario_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT movimientos_inventario_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['entrada'::character varying, 'salida'::character varying])::text[])))
);


ALTER TABLE public.movimientos_inventario OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16624)
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movimientos_inventario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimientos_inventario_id_seq OWNER TO postgres;

--
-- TOC entry 5310 (class 0 OID 0)
-- Dependencies: 240
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimientos_inventario_id_seq OWNED BY public.movimientos_inventario.id;


--
-- TOC entry 243 (class 1259 OID 16651)
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    area_id integer NOT NULL,
    mesa character varying(20),
    mesero_id integer NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'abierto'::character varying NOT NULL,
    fecha_hora timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 16650)
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_id_seq OWNER TO postgres;

--
-- TOC entry 5311 (class 0 OID 0)
-- Dependencies: 242
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- TOC entry 239 (class 1259 OID 16595)
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    categoria_id integer NOT NULL,
    area_id integer NOT NULL,
    precio numeric(10,2) NOT NULL,
    existencias integer DEFAULT 0 NOT NULL,
    stock_minimo integer DEFAULT 5 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    CONSTRAINT productos_existencias_check CHECK ((existencias >= 0)),
    CONSTRAINT productos_precio_check CHECK ((precio >= (0)::numeric))
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16594)
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

--
-- TOC entry 5312 (class 0 OID 0)
-- Dependencies: 238
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 255 (class 1259 OID 16793)
-- Name: reportes_empleado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reportes_empleado (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    area_id integer,
    tipo character varying(30) NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    contenido text NOT NULL,
    total_reportado numeric(10,2),
    estado character varying(15) DEFAULT 'enviado'::character varying NOT NULL,
    comentario_admin text,
    revisado_por integer,
    revisado_en timestamp without time zone,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT reportes_empleado_estado_check CHECK (((estado)::text = ANY ((ARRAY['enviado'::character varying, 'revisado'::character varying, 'observado'::character varying])::text[]))),
    CONSTRAINT reportes_empleado_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['cierre_caja'::character varying, 'turno'::character varying, 'incidencia'::character varying, 'inventario'::character varying])::text[])))
);


ALTER TABLE public.reportes_empleado OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 16792)
-- Name: reportes_empleado_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reportes_empleado_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reportes_empleado_id_seq OWNER TO postgres;

--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 254
-- Name: reportes_empleado_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reportes_empleado_id_seq OWNED BY public.reportes_empleado.id;


--
-- TOC entry 235 (class 1259 OID 16548)
-- Name: reservas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservas (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    cabana_id integer NOT NULL,
    fecha_entrada date NOT NULL,
    fecha_salida date NOT NULL,
    anticipo numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    usuario_id integer NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT reservas_check CHECK ((fecha_salida > fecha_entrada))
);


ALTER TABLE public.reservas OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16547)
-- Name: reservas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservas_id_seq OWNER TO postgres;

--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 234
-- Name: reservas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reservas_id_seq OWNED BY public.reservas.id;


--
-- TOC entry 221 (class 1259 OID 16437)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(30) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16436)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 220
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 229 (class 1259 OID 16493)
-- Name: tipos_acceso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_acceso (
    id integer NOT NULL,
    nombre character varying(30) NOT NULL,
    precio numeric(8,2) NOT NULL,
    CONSTRAINT tipos_acceso_precio_check CHECK ((precio >= (0)::numeric))
);


ALTER TABLE public.tipos_acceso OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16492)
-- Name: tipos_acceso_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipos_acceso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_acceso_id_seq OWNER TO postgres;

--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 228
-- Name: tipos_acceso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipos_acceso_id_seq OWNED BY public.tipos_acceso.id;


--
-- TOC entry 225 (class 1259 OID 16459)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    usuario character varying(50) NOT NULL,
    contrasena character varying(255) NOT NULL,
    rol_id integer NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16458)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 224
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 4987 (class 2604 OID 16509)
-- Name: accesos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accesos ALTER COLUMN id SET DEFAULT nextval('public.accesos_id_seq'::regclass);


--
-- TOC entry 4980 (class 2604 OID 16451)
-- Name: areas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas ALTER COLUMN id SET DEFAULT nextval('public.areas_id_seq'::regclass);


--
-- TOC entry 4989 (class 2604 OID 16534)
-- Name: cabanas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabanas ALTER COLUMN id SET DEFAULT nextval('public.cabanas_id_seq'::regclass);


--
-- TOC entry 5011 (class 2604 OID 16746)
-- Name: caja_diaria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caja_diaria ALTER COLUMN id SET DEFAULT nextval('public.caja_diaria_id_seq'::regclass);


--
-- TOC entry 5007 (class 2604 OID 16704)
-- Name: categorias_gasto id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_gasto ALTER COLUMN id SET DEFAULT nextval('public.categorias_gasto_id_seq'::regclass);


--
-- TOC entry 4995 (class 2604 OID 16587)
-- Name: categorias_producto id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_producto ALTER COLUMN id SET DEFAULT nextval('public.categorias_producto_id_seq'::regclass);


--
-- TOC entry 4984 (class 2604 OID 16485)
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- TOC entry 5006 (class 2604 OID 16680)
-- Name: detalle_pedido id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido ALTER COLUMN id SET DEFAULT nextval('public.detalle_pedido_id_seq'::regclass);


--
-- TOC entry 5008 (class 2604 OID 16715)
-- Name: gastos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos ALTER COLUMN id SET DEFAULT nextval('public.gastos_id_seq'::regclass);


--
-- TOC entry 5016 (class 2604 OID 16769)
-- Name: movimientos_caja id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja ALTER COLUMN id SET DEFAULT nextval('public.movimientos_caja_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 16628)
-- Name: movimientos_inventario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario ALTER COLUMN id SET DEFAULT nextval('public.movimientos_inventario_id_seq'::regclass);


--
-- TOC entry 5002 (class 2604 OID 16654)
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- TOC entry 4996 (class 2604 OID 16598)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 5018 (class 2604 OID 16796)
-- Name: reportes_empleado id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes_empleado ALTER COLUMN id SET DEFAULT nextval('public.reportes_empleado_id_seq'::regclass);


--
-- TOC entry 4991 (class 2604 OID 16551)
-- Name: reservas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas ALTER COLUMN id SET DEFAULT nextval('public.reservas_id_seq'::regclass);


--
-- TOC entry 4979 (class 2604 OID 16440)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4986 (class 2604 OID 16496)
-- Name: tipos_acceso id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_acceso ALTER COLUMN id SET DEFAULT nextval('public.tipos_acceso_id_seq'::regclass);


--
-- TOC entry 4981 (class 2604 OID 16462)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 5269 (class 0 OID 16506)
-- Dependencies: 231
-- Data for Name: accesos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accesos (id, tipo_acceso_id, cantidad, monto, usuario_id, fecha_hora) FROM stdin;
\.


--
-- TOC entry 5261 (class 0 OID 16448)
-- Dependencies: 223
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.areas (id, nombre) FROM stdin;
1	piscinas
2	cabanas
3	restaurante
4	bar
\.


--
-- TOC entry 5271 (class 0 OID 16531)
-- Dependencies: 233
-- Data for Name: cabanas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cabanas (id, nombre, capacidad, precio_noche, estado) FROM stdin;
1	Cabaña 1	4	40.00	disponible
2	Cabaña 2	6	60.00	disponible
3	Cabaña 3	8	80.00	disponible
\.


--
-- TOC entry 5289 (class 0 OID 16743)
-- Dependencies: 251
-- Data for Name: caja_diaria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.caja_diaria (id, fecha, monto_apertura, monto_cierre, estado, usuario_id, abierta_en, cerrada_en) FROM stdin;
\.


--
-- TOC entry 5285 (class 0 OID 16701)
-- Dependencies: 247
-- Data for Name: categorias_gasto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias_gasto (id, nombre) FROM stdin;
1	planilla
2	compras
3	mantenimiento
4	servicios
5	otros
\.


--
-- TOC entry 5275 (class 0 OID 16584)
-- Dependencies: 237
-- Data for Name: categorias_producto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias_producto (id, nombre) FROM stdin;
1	comida
2	bebida
3	licor
\.


--
-- TOC entry 5265 (class 0 OID 16482)
-- Dependencies: 227
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id, nombre, telefono, documento, creado_en) FROM stdin;
\.


--
-- TOC entry 5283 (class 0 OID 16677)
-- Dependencies: 245
-- Data for Name: detalle_pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_pedido (id, pedido_id, producto_id, cantidad, precio_unitario, subtotal) FROM stdin;
\.


--
-- TOC entry 5287 (class 0 OID 16712)
-- Dependencies: 249
-- Data for Name: gastos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gastos (id, categoria_id, area_id, monto, descripcion, fecha, usuario_id, creado_en) FROM stdin;
\.


--
-- TOC entry 5291 (class 0 OID 16766)
-- Dependencies: 253
-- Data for Name: movimientos_caja; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimientos_caja (id, caja_id, tipo, area_id, concepto, monto, fecha_hora) FROM stdin;
\.


--
-- TOC entry 5279 (class 0 OID 16625)
-- Dependencies: 241
-- Data for Name: movimientos_inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimientos_inventario (id, producto_id, tipo, cantidad, motivo, usuario_id, fecha_hora) FROM stdin;
\.


--
-- TOC entry 5281 (class 0 OID 16651)
-- Dependencies: 243
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, area_id, mesa, mesero_id, total, estado, fecha_hora) FROM stdin;
\.


--
-- TOC entry 5277 (class 0 OID 16595)
-- Dependencies: 239
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id, nombre, categoria_id, area_id, precio, existencias, stock_minimo, activo) FROM stdin;
1	Pollo frito con papas	1	3	6.50	30	5	t
2	Pupusas (unidad)	1	3	0.75	100	20	t
3	Gaseosa	2	3	1.00	50	10	t
4	Cerveza	3	4	2.00	60	12	t
5	Piña colada	3	4	4.50	20	5	t
\.


--
-- TOC entry 5293 (class 0 OID 16793)
-- Dependencies: 255
-- Data for Name: reportes_empleado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reportes_empleado (id, usuario_id, area_id, tipo, fecha, contenido, total_reportado, estado, comentario_admin, revisado_por, revisado_en, creado_en) FROM stdin;
\.


--
-- TOC entry 5273 (class 0 OID 16548)
-- Dependencies: 235
-- Data for Name: reservas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservas (id, cliente_id, cabana_id, fecha_entrada, fecha_salida, anticipo, total, estado, usuario_id, creado_en) FROM stdin;
\.


--
-- TOC entry 5259 (class 0 OID 16437)
-- Dependencies: 221
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, nombre) FROM stdin;
1	administrador
2	cajero
3	mesero
\.


--
-- TOC entry 5267 (class 0 OID 16493)
-- Dependencies: 229
-- Data for Name: tipos_acceso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipos_acceso (id, nombre, precio) FROM stdin;
1	adulto	5.00
2	nino	3.00
\.


--
-- TOC entry 5263 (class 0 OID 16459)
-- Dependencies: 225
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, usuario, contrasena, rol_id, activo, creado_en) FROM stdin;
1	Administrador	admin	$2a$06$IWOy3Ts1MFlZPgQD1WNN5.S2XoP8nGGJsHS8kQ.VkauyCnsEPQoiq	1	t	2026-10-07 08:01:19.924512
\.


--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 230
-- Name: accesos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accesos_id_seq', 1, false);


--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 222
-- Name: areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.areas_id_seq', 4, true);


--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 232
-- Name: cabanas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cabanas_id_seq', 3, true);


--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 250
-- Name: caja_diaria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.caja_diaria_id_seq', 1, false);


--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 246
-- Name: categorias_gasto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_gasto_id_seq', 6, true);


--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 236
-- Name: categorias_producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_producto_id_seq', 3, true);


--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 226
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_seq', 1, false);


--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 244
-- Name: detalle_pedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_pedido_id_seq', 1, false);


--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 248
-- Name: gastos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gastos_id_seq', 1, false);


--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 252
-- Name: movimientos_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimientos_caja_id_seq', 1, false);


--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 240
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimientos_inventario_id_seq', 1, false);


--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 242
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 1, false);


--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 238
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 5, true);


--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 254
-- Name: reportes_empleado_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reportes_empleado_id_seq', 1, false);


--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 234
-- Name: reservas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reservas_id_seq', 1, false);


--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 220
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 228
-- Name: tipos_acceso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipos_acceso_id_seq', 2, true);


--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 224
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);


--
-- TOC entry 5057 (class 2606 OID 16519)
-- Name: accesos accesos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accesos
    ADD CONSTRAINT accesos_pkey PRIMARY KEY (id);


--
-- TOC entry 5043 (class 2606 OID 16457)
-- Name: areas areas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_nombre_key UNIQUE (nombre);


--
-- TOC entry 5045 (class 2606 OID 16455)
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- TOC entry 5059 (class 2606 OID 16546)
-- Name: cabanas cabanas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabanas
    ADD CONSTRAINT cabanas_nombre_key UNIQUE (nombre);


--
-- TOC entry 5061 (class 2606 OID 16544)
-- Name: cabanas cabanas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabanas
    ADD CONSTRAINT cabanas_pkey PRIMARY KEY (id);


--
-- TOC entry 5083 (class 2606 OID 16759)
-- Name: caja_diaria caja_diaria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caja_diaria
    ADD CONSTRAINT caja_diaria_pkey PRIMARY KEY (id);


--
-- TOC entry 5077 (class 2606 OID 16710)
-- Name: categorias_gasto categorias_gasto_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_gasto
    ADD CONSTRAINT categorias_gasto_nombre_key UNIQUE (nombre);


--
-- TOC entry 5079 (class 2606 OID 16708)
-- Name: categorias_gasto categorias_gasto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_gasto
    ADD CONSTRAINT categorias_gasto_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 16593)
-- Name: categorias_producto categorias_producto_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_producto
    ADD CONSTRAINT categorias_producto_nombre_key UNIQUE (nombre);


--
-- TOC entry 5067 (class 2606 OID 16591)
-- Name: categorias_producto categorias_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_producto
    ADD CONSTRAINT categorias_producto_pkey PRIMARY KEY (id);


--
-- TOC entry 5051 (class 2606 OID 16491)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 5075 (class 2606 OID 16689)
-- Name: detalle_pedido detalle_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pkey PRIMARY KEY (id);


--
-- TOC entry 5081 (class 2606 OID 16726)
-- Name: gastos gastos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_pkey PRIMARY KEY (id);


--
-- TOC entry 5085 (class 2606 OID 16780)
-- Name: movimientos_caja movimientos_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_pkey PRIMARY KEY (id);


--
-- TOC entry 5071 (class 2606 OID 16639)
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id);


--
-- TOC entry 5073 (class 2606 OID 16665)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 5069 (class 2606 OID 16613)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 5087 (class 2606 OID 16812)
-- Name: reportes_empleado reportes_empleado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes_empleado
    ADD CONSTRAINT reportes_empleado_pkey PRIMARY KEY (id);


--
-- TOC entry 5063 (class 2606 OID 16567)
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- TOC entry 5039 (class 2606 OID 16446)
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- TOC entry 5041 (class 2606 OID 16444)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5053 (class 2606 OID 16504)
-- Name: tipos_acceso tipos_acceso_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_acceso
    ADD CONSTRAINT tipos_acceso_nombre_key UNIQUE (nombre);


--
-- TOC entry 5055 (class 2606 OID 16502)
-- Name: tipos_acceso tipos_acceso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_acceso
    ADD CONSTRAINT tipos_acceso_pkey PRIMARY KEY (id);


--
-- TOC entry 5047 (class 2606 OID 16473)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 5049 (class 2606 OID 16475)
-- Name: usuarios usuarios_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);


--
-- TOC entry 5089 (class 2606 OID 16520)
-- Name: accesos accesos_tipo_acceso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accesos
    ADD CONSTRAINT accesos_tipo_acceso_id_fkey FOREIGN KEY (tipo_acceso_id) REFERENCES public.tipos_acceso(id);


--
-- TOC entry 5090 (class 2606 OID 16525)
-- Name: accesos accesos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accesos
    ADD CONSTRAINT accesos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5105 (class 2606 OID 16760)
-- Name: caja_diaria caja_diaria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caja_diaria
    ADD CONSTRAINT caja_diaria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5100 (class 2606 OID 16690)
-- Name: detalle_pedido detalle_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 5101 (class 2606 OID 16695)
-- Name: detalle_pedido detalle_pedido_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 5102 (class 2606 OID 16732)
-- Name: gastos gastos_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- TOC entry 5103 (class 2606 OID 16727)
-- Name: gastos gastos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_gasto(id);


--
-- TOC entry 5104 (class 2606 OID 16737)
-- Name: gastos gastos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5106 (class 2606 OID 16786)
-- Name: movimientos_caja movimientos_caja_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- TOC entry 5107 (class 2606 OID 16781)
-- Name: movimientos_caja movimientos_caja_caja_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES public.caja_diaria(id);


--
-- TOC entry 5096 (class 2606 OID 16640)
-- Name: movimientos_inventario movimientos_inventario_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 5097 (class 2606 OID 16645)
-- Name: movimientos_inventario movimientos_inventario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5098 (class 2606 OID 16666)
-- Name: pedidos pedidos_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- TOC entry 5099 (class 2606 OID 16671)
-- Name: pedidos pedidos_mesero_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_mesero_id_fkey FOREIGN KEY (mesero_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5094 (class 2606 OID 16619)
-- Name: productos productos_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- TOC entry 5095 (class 2606 OID 16614)
-- Name: productos productos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_producto(id);


--
-- TOC entry 5108 (class 2606 OID 16818)
-- Name: reportes_empleado reportes_empleado_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes_empleado
    ADD CONSTRAINT reportes_empleado_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- TOC entry 5109 (class 2606 OID 16823)
-- Name: reportes_empleado reportes_empleado_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes_empleado
    ADD CONSTRAINT reportes_empleado_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.usuarios(id);


--
-- TOC entry 5110 (class 2606 OID 16813)
-- Name: reportes_empleado reportes_empleado_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes_empleado
    ADD CONSTRAINT reportes_empleado_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5091 (class 2606 OID 16573)
-- Name: reservas reservas_cabana_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_cabana_id_fkey FOREIGN KEY (cabana_id) REFERENCES public.cabanas(id);


--
-- TOC entry 5092 (class 2606 OID 16568)
-- Name: reservas reservas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- TOC entry 5093 (class 2606 OID 16578)
-- Name: reservas reservas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5088 (class 2606 OID 16476)
-- Name: usuarios usuarios_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


-- Completed on 2026-10-09 09:28:51

--
-- PostgreSQL database dump complete
--

\unrestrict 80PcubBUkRMyfLiqJBDLNnFfEYfaiX3PIBcPGrhriagmXJWDgAgv85vhoJkgBG7

