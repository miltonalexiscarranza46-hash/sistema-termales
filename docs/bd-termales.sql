--
-- PostgreSQL database dump
--

\restrict CmOJWY4DFcDmfdN8VUyJoK9MJxmphIHxnXFlkSInbV4OUZgIqhFeN9baaetkx04

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accesos; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accesos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accesos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accesos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accesos_id_seq OWNED BY public.accesos.id;


--
-- Name: areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.areas (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


--
-- Name: areas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.areas_id_seq OWNED BY public.areas.id;


--
-- Name: cabanas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cabanas (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    capacidad integer NOT NULL,
    precio_persona numeric(10,2) CONSTRAINT cabanas_precio_noche_not_null NOT NULL,
    estado character varying(20) DEFAULT 'disponible'::character varying NOT NULL,
    CONSTRAINT cabanas_capacidad_check CHECK ((capacidad > 0)),
    CONSTRAINT cabanas_precio_noche_check CHECK ((precio_persona >= (0)::numeric))
);


--
-- Name: cabanas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cabanas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cabanas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cabanas_id_seq OWNED BY public.cabanas.id;


--
-- Name: caja_diaria; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: caja_diaria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.caja_diaria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: caja_diaria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.caja_diaria_id_seq OWNED BY public.caja_diaria.id;


--
-- Name: categorias_gasto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_gasto (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


--
-- Name: categorias_gasto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_gasto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_gasto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_gasto_id_seq OWNED BY public.categorias_gasto.id;


--
-- Name: categorias_producto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_producto (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


--
-- Name: categorias_producto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_producto_id_seq OWNED BY public.categorias_producto.id;


--
-- Name: citas_masaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.citas_masaje (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    servicio_id integer NOT NULL,
    masajista_id integer NOT NULL,
    inicio timestamp without time zone NOT NULL,
    fin timestamp without time zone NOT NULL,
    precio numeric(10,2) NOT NULL,
    estado character varying(15) DEFAULT 'agendada'::character varying NOT NULL,
    cobrado_en timestamp without time zone,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT citas_masaje_check CHECK ((fin > inicio)),
    CONSTRAINT citas_masaje_estado_check CHECK (((estado)::text = ANY ((ARRAY['agendada'::character varying, 'cobrada'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT citas_masaje_precio_check CHECK ((precio >= (0)::numeric))
);


--
-- Name: citas_masaje_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.citas_masaje_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: citas_masaje_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.citas_masaje_id_seq OWNED BY public.citas_masaje.id;


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    telefono character varying(20),
    documento character varying(20),
    creado_en timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: detalle_pedido; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: detalle_pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detalle_pedido_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detalle_pedido_id_seq OWNED BY public.detalle_pedido.id;


--
-- Name: gastos; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: gastos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gastos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gastos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gastos_id_seq OWNED BY public.gastos.id;


--
-- Name: movimientos_caja; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: movimientos_caja_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movimientos_caja_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimientos_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movimientos_caja_id_seq OWNED BY public.movimientos_caja.id;


--
-- Name: movimientos_inventario; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movimientos_inventario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movimientos_inventario_id_seq OWNED BY public.movimientos_inventario.id;


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- Name: reportes_empleado; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: reportes_empleado_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reportes_empleado_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reportes_empleado_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reportes_empleado_id_seq OWNED BY public.reportes_empleado.id;


--
-- Name: reservas; Type: TABLE; Schema: public; Owner: -
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
    personas integer DEFAULT 1 NOT NULL,
    CONSTRAINT reservas_check CHECK ((fecha_salida > fecha_entrada)),
    CONSTRAINT reservas_personas_check CHECK ((personas > 0))
);


--
-- Name: reservas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_id_seq OWNED BY public.reservas.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(30) NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: servicios_masaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicios_masaje (
    id integer NOT NULL,
    nombre character varying(80) NOT NULL,
    duracion_min integer NOT NULL,
    precio numeric(10,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    CONSTRAINT servicios_masaje_duracion_min_check CHECK ((duracion_min > 0)),
    CONSTRAINT servicios_masaje_precio_check CHECK ((precio >= (0)::numeric))
);


--
-- Name: servicios_masaje_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.servicios_masaje_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: servicios_masaje_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.servicios_masaje_id_seq OWNED BY public.servicios_masaje.id;


--
-- Name: tipos_acceso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_acceso (
    id integer NOT NULL,
    nombre character varying(30) NOT NULL,
    precio numeric(8,2) NOT NULL,
    CONSTRAINT tipos_acceso_precio_check CHECK ((precio >= (0)::numeric))
);


--
-- Name: tipos_acceso_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_acceso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_acceso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_acceso_id_seq OWNED BY public.tipos_acceso.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: accesos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accesos ALTER COLUMN id SET DEFAULT nextval('public.accesos_id_seq'::regclass);


--
-- Name: areas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas ALTER COLUMN id SET DEFAULT nextval('public.areas_id_seq'::regclass);


--
-- Name: cabanas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cabanas ALTER COLUMN id SET DEFAULT nextval('public.cabanas_id_seq'::regclass);


--
-- Name: caja_diaria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caja_diaria ALTER COLUMN id SET DEFAULT nextval('public.caja_diaria_id_seq'::regclass);


--
-- Name: categorias_gasto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_gasto ALTER COLUMN id SET DEFAULT nextval('public.categorias_gasto_id_seq'::regclass);


--
-- Name: categorias_producto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_producto ALTER COLUMN id SET DEFAULT nextval('public.categorias_producto_id_seq'::regclass);


--
-- Name: citas_masaje id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas_masaje ALTER COLUMN id SET DEFAULT nextval('public.citas_masaje_id_seq'::regclass);


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: detalle_pedido id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido ALTER COLUMN id SET DEFAULT nextval('public.detalle_pedido_id_seq'::regclass);


--
-- Name: gastos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gastos ALTER COLUMN id SET DEFAULT nextval('public.gastos_id_seq'::regclass);


--
-- Name: movimientos_caja id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja ALTER COLUMN id SET DEFAULT nextval('public.movimientos_caja_id_seq'::regclass);


--
-- Name: movimientos_inventario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario ALTER COLUMN id SET DEFAULT nextval('public.movimientos_inventario_id_seq'::regclass);


--
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- Name: reportes_empleado id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_empleado ALTER COLUMN id SET DEFAULT nextval('public.reportes_empleado_id_seq'::regclass);


--
-- Name: reservas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas ALTER COLUMN id SET DEFAULT nextval('public.reservas_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: servicios_masaje id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios_masaje ALTER COLUMN id SET DEFAULT nextval('public.servicios_masaje_id_seq'::regclass);


--
-- Name: tipos_acceso id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_acceso ALTER COLUMN id SET DEFAULT nextval('public.tipos_acceso_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: accesos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accesos (id, tipo_acceso_id, cantidad, monto, usuario_id, fecha_hora) FROM stdin;
1	1	2	20.00	1	2026-10-11 14:56:12.80635
2	1	5	50.00	1	2026-10-13 09:38:57.581406
3	1	2	20.00	7	2026-10-14 22:03:53.176909
4	1	2	20.00	7	2026-10-14 22:04:06.467674
\.


--
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.areas (id, nombre) FROM stdin;
1	piscinas
2	cabanas
3	restaurante
4	bar
5	masajes
\.


--
-- Data for Name: cabanas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cabanas (id, nombre, capacidad, precio_persona, estado) FROM stdin;
1	Villa Italia	3	90.00	disponible
2	Estados Unidos 1	2	80.00	disponible
3	Estados Unidos 2	2	80.00	disponible
4	Estados Unidos 3	4	80.00	disponible
5	Estados Unidos 4	4	80.00	disponible
6	Francia 1	2	80.00	disponible
7	Francia 2	4	80.00	disponible
8	Villa Japón	2	85.00	disponible
9	Privado	4	75.00	disponible
10	Suite Presidencial	2	85.00	disponible
11	Suiza 1	2	80.00	disponible
12	Suiza 2	2	75.00	disponible
13	Alemania 1	2	85.00	disponible
14	Alemania 2	2	85.00	disponible
15	Villa Argentina	2	90.00	disponible
\.


--
-- Data for Name: caja_diaria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.caja_diaria (id, fecha, monto_apertura, monto_cierre, estado, usuario_id, abierta_en, cerrada_en) FROM stdin;
\.


--
-- Data for Name: categorias_gasto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias_gasto (id, nombre) FROM stdin;
1	planilla
2	compras
3	mantenimiento
4	servicios
5	otros
\.


--
-- Data for Name: categorias_producto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias_producto (id, nombre) FROM stdin;
1	comida
2	bebida
3	licor
\.


--
-- Data for Name: citas_masaje; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.citas_masaje (id, cliente_id, servicio_id, masajista_id, inicio, fin, precio, estado, cobrado_en, creado_en) FROM stdin;
1	6	1	8	2026-12-10 09:00:00	2026-12-10 10:00:00	25.00	cobrada	2026-10-14 07:58:26.498694	2026-10-14 07:58:26.421072
2	7	1	8	2026-12-10 10:00:00	2026-12-10 11:00:00	25.00	cancelada	\N	2026-10-14 07:58:26.465806
3	8	1	8	2026-10-14 22:00:00	2026-10-14 23:00:00	25.00	cobrada	2026-10-14 22:01:32.146926	2026-10-14 22:01:27.032404
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clientes (id, nombre, telefono, documento, creado_en) FROM stdin;
1	Cliente Prueba	70000000	\N	2026-10-11 15:53:45.134077
2	Prueba Uno	7000-0000	\N	2026-10-12 11:44:51.959187
3	Prueba Dos	\N	\N	2026-10-12 11:46:17.687527
4	Prueba Personas	70000000	\N	2026-10-12 21:37:43.947009
5	Milton Alexis Carranza	64546622	\N	2026-10-12 21:42:02.892924
6	Cliente Uno	7000-1111	\N	2026-10-14 07:58:26.421072
7	Cliente Dos	\N	\N	2026-10-14 07:58:26.465806
8	MIlton	60606060	\N	2026-10-14 22:01:27.032404
9	Prueba Resumen	\N	\N	2026-10-14 22:04:52.964034
\.


--
-- Data for Name: detalle_pedido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalle_pedido (id, pedido_id, producto_id, cantidad, precio_unitario, subtotal) FROM stdin;
\.


--
-- Data for Name: gastos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gastos (id, categoria_id, area_id, monto, descripcion, fecha, usuario_id, creado_en) FROM stdin;
3	1	\N	100.00	Pago de planilla	2026-10-14	1	2026-10-14 22:19:27.367775
\.


--
-- Data for Name: movimientos_caja; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimientos_caja (id, caja_id, tipo, area_id, concepto, monto, fecha_hora) FROM stdin;
\.


--
-- Data for Name: movimientos_inventario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimientos_inventario (id, producto_id, tipo, cantidad, motivo, usuario_id, fecha_hora) FROM stdin;
\.


--
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pedidos (id, area_id, mesa, mesero_id, total, estado, fecha_hora) FROM stdin;
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.productos (id, nombre, categoria_id, area_id, precio, existencias, stock_minimo, activo) FROM stdin;
1	Pollo frito con papas	1	3	6.50	30	5	t
2	Pupusas (unidad)	1	3	0.75	100	20	t
3	Gaseosa	2	3	1.00	50	10	t
4	Cerveza	3	4	2.00	60	12	t
5	Piña colada	3	4	4.50	20	5	t
\.


--
-- Data for Name: reportes_empleado; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reportes_empleado (id, usuario_id, area_id, tipo, fecha, contenido, total_reportado, estado, comentario_admin, revisado_por, revisado_en, creado_en) FROM stdin;
\.


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reservas (id, cliente_id, cabana_id, fecha_entrada, fecha_salida, anticipo, total, estado, usuario_id, creado_en, personas) FROM stdin;
1	1	1	2026-12-20	2026-12-22	20.00	80.00	pendiente	1	2026-10-11 15:53:45.134077	1
2	2	1	2026-12-10	2026-12-12	20.00	80.00	cancelada	1	2026-10-12 11:44:51.959187	1
3	3	1	2026-12-10	2026-12-12	0.00	80.00	pendiente	1	2026-10-12 11:46:17.687527	1
4	4	1	2027-02-10	2027-02-12	100.00	540.00	pendiente	1	2026-10-12 21:37:43.947009	3
5	5	4	2026-10-12	2026-10-13	100.00	240.00	pendiente	3	2026-10-12 21:42:02.892924	3
6	9	2	2027-01-10	2027-01-12	30.00	320.00	pendiente	7	2026-10-14 22:04:52.964034	2
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, nombre) FROM stdin;
1	administrador
2	cajero
3	mesero
4	recepcionista
5	masajista
6	bodega
\.


--
-- Data for Name: servicios_masaje; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.servicios_masaje (id, nombre, duracion_min, precio, activo) FROM stdin;
1	Masaje relajante	60	25.00	t
2	Masaje descontracturante	60	30.00	t
3	Piedras calientes	90	40.00	t
\.


--
-- Data for Name: tipos_acceso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipos_acceso (id, nombre, precio) FROM stdin;
1	Adulto (13 años en adelante)	10.00
2	Niño (hasta 12 años)	5.00
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nombre, usuario, contrasena, rol_id, activo, creado_en) FROM stdin;
1	Administrador	admin	$2b$10$QDoFXvD5aommH1h0Z1dDO.9SKNMtlcSeYO4NqYArGKv1OnYn1V70m	1	t	2026-10-07 08:01:19.924512
3	Cajero Prueba	cajero	$2b$10$KZr0R2qrp4OjmouKqnqEGurmaHOUYbVwseew8wAYBGruJbFj86DpK	2	t	2026-10-10 18:43:19.016574
4	Mesero Prueba	mesero	$2b$10$KZr0R2qrp4OjmouKqnqEGurmaHOUYbVwseew8wAYBGruJbFj86DpK	3	t	2026-10-10 18:43:19.016574
7	Recepcionista Prueba	recepcion	$2b$10$KZr0R2qrp4OjmouKqnqEGurmaHOUYbVwseew8wAYBGruJbFj86DpK	4	t	2026-10-14 07:43:13.962229
8	Masajista Prueba	masajista	$2b$10$KZr0R2qrp4OjmouKqnqEGurmaHOUYbVwseew8wAYBGruJbFj86DpK	5	t	2026-10-14 07:43:13.966848
9	Bodega Prueba	bodega	$2b$10$KZr0R2qrp4OjmouKqnqEGurmaHOUYbVwseew8wAYBGruJbFj86DpK	6	t	2026-10-14 07:43:13.967869
\.


--
-- Name: accesos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accesos_id_seq', 4, true);


--
-- Name: areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.areas_id_seq', 5, true);


--
-- Name: cabanas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cabanas_id_seq', 15, true);


--
-- Name: caja_diaria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.caja_diaria_id_seq', 1, false);


--
-- Name: categorias_gasto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categorias_gasto_id_seq', 6, true);


--
-- Name: categorias_producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categorias_producto_id_seq', 3, true);


--
-- Name: citas_masaje_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.citas_masaje_id_seq', 3, true);


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clientes_id_seq', 9, true);


--
-- Name: detalle_pedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detalle_pedido_id_seq', 1, false);


--
-- Name: gastos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.gastos_id_seq', 4, true);


--
-- Name: movimientos_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movimientos_caja_id_seq', 1, false);


--
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movimientos_inventario_id_seq', 1, false);


--
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 1, false);


--
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.productos_id_seq', 5, true);


--
-- Name: reportes_empleado_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reportes_empleado_id_seq', 1, false);


--
-- Name: reservas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reservas_id_seq', 6, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 9, true);


--
-- Name: servicios_masaje_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.servicios_masaje_id_seq', 3, true);


--
-- Name: tipos_acceso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipos_acceso_id_seq', 3, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 9, true);


--
-- Name: accesos accesos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accesos
    ADD CONSTRAINT accesos_pkey PRIMARY KEY (id);


--
-- Name: areas areas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_nombre_key UNIQUE (nombre);


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- Name: cabanas cabanas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cabanas
    ADD CONSTRAINT cabanas_nombre_key UNIQUE (nombre);


--
-- Name: cabanas cabanas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cabanas
    ADD CONSTRAINT cabanas_pkey PRIMARY KEY (id);


--
-- Name: caja_diaria caja_diaria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caja_diaria
    ADD CONSTRAINT caja_diaria_pkey PRIMARY KEY (id);


--
-- Name: categorias_gasto categorias_gasto_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_gasto
    ADD CONSTRAINT categorias_gasto_nombre_key UNIQUE (nombre);


--
-- Name: categorias_gasto categorias_gasto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_gasto
    ADD CONSTRAINT categorias_gasto_pkey PRIMARY KEY (id);


--
-- Name: categorias_producto categorias_producto_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_producto
    ADD CONSTRAINT categorias_producto_nombre_key UNIQUE (nombre);


--
-- Name: categorias_producto categorias_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_producto
    ADD CONSTRAINT categorias_producto_pkey PRIMARY KEY (id);


--
-- Name: citas_masaje citas_masaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas_masaje
    ADD CONSTRAINT citas_masaje_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: detalle_pedido detalle_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pkey PRIMARY KEY (id);


--
-- Name: gastos gastos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_pkey PRIMARY KEY (id);


--
-- Name: movimientos_caja movimientos_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_pkey PRIMARY KEY (id);


--
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: reportes_empleado reportes_empleado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_empleado
    ADD CONSTRAINT reportes_empleado_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: servicios_masaje servicios_masaje_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios_masaje
    ADD CONSTRAINT servicios_masaje_nombre_key UNIQUE (nombre);


--
-- Name: servicios_masaje servicios_masaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios_masaje
    ADD CONSTRAINT servicios_masaje_pkey PRIMARY KEY (id);


--
-- Name: tipos_acceso tipos_acceso_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_acceso
    ADD CONSTRAINT tipos_acceso_nombre_key UNIQUE (nombre);


--
-- Name: tipos_acceso tipos_acceso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_acceso
    ADD CONSTRAINT tipos_acceso_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_usuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);


--
-- Name: idx_citas_masajista_inicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_citas_masajista_inicio ON public.citas_masaje USING btree (masajista_id, inicio);


--
-- Name: accesos accesos_tipo_acceso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accesos
    ADD CONSTRAINT accesos_tipo_acceso_id_fkey FOREIGN KEY (tipo_acceso_id) REFERENCES public.tipos_acceso(id);


--
-- Name: accesos accesos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accesos
    ADD CONSTRAINT accesos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: caja_diaria caja_diaria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caja_diaria
    ADD CONSTRAINT caja_diaria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: citas_masaje citas_masaje_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas_masaje
    ADD CONSTRAINT citas_masaje_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: citas_masaje citas_masaje_masajista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas_masaje
    ADD CONSTRAINT citas_masaje_masajista_id_fkey FOREIGN KEY (masajista_id) REFERENCES public.usuarios(id);


--
-- Name: citas_masaje citas_masaje_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas_masaje
    ADD CONSTRAINT citas_masaje_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios_masaje(id);


--
-- Name: detalle_pedido detalle_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: detalle_pedido detalle_pedido_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: gastos gastos_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: gastos gastos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_gasto(id);


--
-- Name: gastos gastos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: movimientos_caja movimientos_caja_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: movimientos_caja movimientos_caja_caja_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES public.caja_diaria(id);


--
-- Name: movimientos_inventario movimientos_inventario_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: movimientos_inventario movimientos_inventario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: pedidos pedidos_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: pedidos pedidos_mesero_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_mesero_id_fkey FOREIGN KEY (mesero_id) REFERENCES public.usuarios(id);


--
-- Name: productos productos_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: productos productos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_producto(id);


--
-- Name: reportes_empleado reportes_empleado_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_empleado
    ADD CONSTRAINT reportes_empleado_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: reportes_empleado reportes_empleado_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_empleado
    ADD CONSTRAINT reportes_empleado_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.usuarios(id);


--
-- Name: reportes_empleado reportes_empleado_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_empleado
    ADD CONSTRAINT reportes_empleado_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: reservas reservas_cabana_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_cabana_id_fkey FOREIGN KEY (cabana_id) REFERENCES public.cabanas(id);


--
-- Name: reservas reservas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: reservas reservas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: usuarios usuarios_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict CmOJWY4DFcDmfdN8VUyJoK9MJxmphIHxnXFlkSInbV4OUZgIqhFeN9baaetkx04

